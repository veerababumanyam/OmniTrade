import { create } from 'zustand';
import api from '../api/client';
import type {
    Portfolio,
    Position,
    ExecutedTrade,
    LivePrice,
    TradeRequest,
    CreatePortfolioRequest,
    WebSocketClientMessage,
    WebSocketPriceUpdate
} from '../types/portfolio';

interface PortfolioState {
    // State
    portfolios: Portfolio[];
    currentPortfolio: Portfolio | null;
    positions: Position[];
    livePrices: Map<string, LivePrice>;
    loading: boolean;
    error: string | null;

    // Portfolio Methods
    fetchPortfolios: () => Promise<Portfolio[]>;
    fetchPortfolio: (id: string) => Promise<Portfolio>;
    createPortfolio: (request: CreatePortfolioRequest) => Promise<Portfolio>;

    // Position Methods
    fetchPositions: (portfolioId: string) => Promise<Position[]>;

    // Trade Methods
    executeTrade: (request: TradeRequest) => Promise<ExecutedTrade>;
    fetchTrades: (portfolioId: string, limit?: number) => Promise<ExecutedTrade[]>;

    // Live Price Methods
    subscribeToPrices: (symbols: string[]) => void;
    unsubscribeFromPrices: (symbols: string[]) => void;
    fetchLivePrice: (symbol: string) => Promise<LivePrice>;

    // Utility Methods
    setCurrentPortfolio: (portfolio: Portfolio | null) => void;
    clearError: () => void;
    reset: () => void;
}

// WebSocket connection singleton
let wsConnection: WebSocket | null = null;
let wsReconnectTimeout: ReturnType<typeof setTimeout> | null = null;
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/prices/stream`;

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    // Initial State
    portfolios: [],
    currentPortfolio: null,
    positions: [],
    livePrices: new Map<string, LivePrice>(),
    loading: false,
    error: null,

    // Portfolio Methods
    fetchPortfolios: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<Portfolio[]>('/portfolios');
            set({ portfolios: response.data, loading: false });
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolios';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    fetchPortfolio: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<Portfolio>(`/portfolios/${id}`);
            set({ currentPortfolio: response.data, loading: false });
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    createPortfolio: async (request: CreatePortfolioRequest) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post<Portfolio>('/portfolios', request);
            set((state) => ({
                portfolios: [...state.portfolios, response.data],
                loading: false,
            }));
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create portfolio';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    // Position Methods
    fetchPositions: async (portfolioId: string) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<Position[]>(`/portfolios/${portfolioId}/positions`);
            set({ positions: response.data, loading: false });
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch positions';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    // Trade Methods
    executeTrade: async (request: TradeRequest) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post<ExecutedTrade>(
                `/portfolios/${request.portfolio_id}/trades`,
                request
            );
            // Refresh positions after successful trade
            await get().fetchPositions(request.portfolio_id);
            set({ loading: false });
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to execute trade';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    fetchTrades: async (portfolioId: string, limit = 100) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<ExecutedTrade[]>(
                `/portfolios/${portfolioId}/trades`,
                { params: { limit } }
            );
            set({ loading: false });
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trades';
            set({ error: errorMessage, loading: false });
            throw err;
        }
    },

    // Live Price Methods
    subscribeToPrices: (symbols: string[]) => {
        if (symbols.length === 0) return;

        const connectWebSocket = () => {
            try {
                wsConnection = new WebSocket(WS_URL);

                wsConnection.onopen = () => {
                    // Subscribe to symbols once connected
                    const message: WebSocketClientMessage = {
                        action: 'subscribe',
                        symbols,
                    };
                    wsConnection?.send(JSON.stringify(message));
                };

                wsConnection.onmessage = (event) => {
                    try {
                        const update: WebSocketPriceUpdate = JSON.parse(event.data);
                        const livePrice: LivePrice = {
                            symbol: update.symbol,
                            price: update.price.toString(),
                            bid: '0', // WebSocket doesn't send bid/ask, use REST for full data
                            ask: '0',
                            volume: update.volume,
                            change: (update.change ?? 0).toString(),
                            change_pct: (update.change_pct ?? 0).toString(),
                            last_updated: update.timestamp,
                        };

                        set((state) => {
                            const newPrices = new Map(state.livePrices);
                            newPrices.set(update.symbol, livePrice);
                            return { livePrices: newPrices };
                        });
                    } catch (parseError) {
                        console.error('Failed to parse WebSocket message:', parseError);
                    }
                };

                wsConnection.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                wsConnection.onclose = () => {
                    // Attempt reconnection after 5 seconds
                    if (wsReconnectTimeout) {
                        clearTimeout(wsReconnectTimeout);
                    }
                    wsReconnectTimeout = setTimeout(() => {
                        const currentSymbols = Array.from(get().livePrices.keys());
                        if (currentSymbols.length > 0) {
                            connectWebSocket();
                        }
                    }, 5000);
                };
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
            }
        };

        // If connection exists, just send subscribe message
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            const message: WebSocketClientMessage = {
                action: 'subscribe',
                symbols,
            };
            wsConnection.send(JSON.stringify(message));
        } else {
            // Create new connection
            connectWebSocket();
        }
    },

    unsubscribeFromPrices: (symbols: string[]) => {
        if (symbols.length === 0) return;

        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            const message: WebSocketClientMessage = {
                action: 'unsubscribe',
                symbols,
            };
            wsConnection.send(JSON.stringify(message));
        }

        // Remove from local state
        set((state) => {
            const newPrices = new Map(state.livePrices);
            symbols.forEach((symbol) => newPrices.delete(symbol));
            return { livePrices: newPrices };
        });
    },

    fetchLivePrice: async (symbol: string) => {
        try {
            const response = await api.get<LivePrice>(`/prices/${symbol}`);
            set((state) => {
                const newPrices = new Map(state.livePrices);
                newPrices.set(symbol, response.data);
                return { livePrices: newPrices };
            });
            return response.data;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live price';
            set({ error: errorMessage });
            throw err;
        }
    },

    // Utility Methods
    setCurrentPortfolio: (portfolio: Portfolio | null) => {
        set({ currentPortfolio: portfolio });
    },

    clearError: () => {
        set({ error: null });
    },

    reset: () => {
        // Close WebSocket connection on reset
        if (wsConnection) {
            wsConnection.close();
            wsConnection = null;
        }
        if (wsReconnectTimeout) {
            clearTimeout(wsReconnectTimeout);
            wsReconnectTimeout = null;
        }

        set({
            portfolios: [],
            currentPortfolio: null,
            positions: [],
            livePrices: new Map<string, LivePrice>(),
            loading: false,
            error: null,
        });
    },
}));
