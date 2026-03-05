package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, implement proper origin checking
		// For now, allow all origins for development
		return true
	},
	HandshakeTimeout: 10 * time.Second,
}

// PriceUpdate represents a price update message sent to WebSocket clients
type PriceUpdate struct {
	Symbol    string  `json:"symbol"`
	Price     float64 `json:"price"`
	Volume    int64   `json:"volume"`
	Timestamp string  `json:"timestamp"`
	Change    float64 `json:"change,omitempty"`
	ChangePct float64 `json:"change_pct,omitempty"`
}

// ClientMessage represents a message received from a WebSocket client
type ClientMessage struct {
	Action  string   `json:"action"`  // "subscribe" or "unsubscribe"
	Symbols []string `json:"symbols"` // List of symbols to subscribe/unsubscribe
}

// WebSocketClient represents an individual WebSocket connection
type WebSocketClient struct {
	hub          *WebSocketHub
	conn         *websocket.Conn
	send         chan []byte
	subscriptions map[string]bool // Set of subscribed symbols
	mu           sync.RWMutex
}

// WebSocketHub manages all WebSocket connections and broadcasts price updates
type WebSocketHub struct {
	clients    map[*WebSocketClient]bool
	broadcast  chan *PriceUpdate
	register   chan *WebSocketClient
	unregister chan *WebSocketClient
	mu         sync.RWMutex

	// Price cache for reconnection support
	priceCache map[string]*PriceUpdate
	cacheMu    sync.RWMutex

	// Ping/pong configuration
	pingInterval time.Duration
	pongWait     time.Duration
	writeWait    time.Duration
}

// NewWebSocketHub creates a new WebSocket hub
func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{
		clients:      make(map[*WebSocketClient]bool),
		broadcast:    make(chan *PriceUpdate, 256),
		register:     make(chan *WebSocketClient),
		unregister:   make(chan *WebSocketClient),
		priceCache:   make(map[string]*PriceUpdate),
		pingInterval: 30 * time.Second,
		pongWait:     60 * time.Second,
		writeWait:    10 * time.Second,
	}
}

// Run starts the hub's main loop for handling connections and broadcasts
func (h *WebSocketHub) Run() {
	ticker := time.NewTicker(h.pingInterval)
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case priceUpdate := <-h.broadcast:
			h.broadcastPrice(priceUpdate)

		case <-ticker.C:
			h.pingAllClients()
		}
	}
}

// registerClient adds a new client to the hub
func (h *WebSocketHub) registerClient(client *WebSocketClient) {
	h.mu.Lock()
	h.clients[client] = true
	h.mu.Unlock()

	log.Printf("WebSocket client connected. Total clients: %d", len(h.clients))

	// Send cached prices for any subscriptions the client might have
	h.sendCachedPrices(client)
}

// unregisterClient removes a client from the hub and cleans up
func (h *WebSocketHub) unregisterClient(client *WebSocketClient) {
	h.mu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)
	}
	h.mu.Unlock()

	log.Printf("WebSocket client disconnected. Total clients: %d", len(h.clients))
}

// broadcastPrice sends a price update to all subscribed clients
func (h *WebSocketHub) broadcastPrice(update *PriceUpdate) {
	// Update price cache
	h.cacheMu.Lock()
	h.priceCache[update.Symbol] = update
	h.cacheMu.Unlock()

	// Marshal the update once
	message, err := json.Marshal(update)
	if err != nil {
		log.Printf("Error marshaling price update: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		// Check if client is subscribed to this symbol
		if client.isSubscribed(update.Symbol) {
			select {
			case client.send <- message:
			default:
				// Client buffer full, skip this update
				// The client will receive the next update
			}
		}
	}
}

// sendCachedPrices sends the latest cached prices to a client for their subscriptions
func (h *WebSocketHub) sendCachedPrices(client *WebSocketClient) {
	h.cacheMu.RLock()
	defer h.cacheMu.RUnlock()

	client.mu.RLock()
	subs := make([]string, 0, len(client.subscriptions))
	for symbol := range client.subscriptions {
		subs = append(subs, symbol)
	}
	client.mu.RUnlock()

	for _, symbol := range subs {
		if update, ok := h.priceCache[symbol]; ok {
			message, err := json.Marshal(update)
			if err != nil {
				continue
			}
			select {
			case client.send <- message:
			default:
				// Buffer full, skip
			}
		}
	}
}

// pingAllClients sends ping messages to all connected clients
func (h *WebSocketHub) pingAllClients() {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if err := client.conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(h.writeWait)); err != nil {
			log.Printf("Ping failed for client: %v", err)
			go func(c *WebSocketClient) {
				h.unregister <- c
			}(client)
		}
	}
}

// BroadcastPrice is the public method to broadcast a price update
func (h *WebSocketHub) BroadcastPrice(update *PriceUpdate) {
	select {
	case h.broadcast <- update:
	default:
		log.Printf("Broadcast channel full, dropping price update for %s", update.Symbol)
	}
}

// BroadcastPriceAsync sends a price update without blocking
func (h *WebSocketHub) BroadcastPriceAsync(update *PriceUpdate) {
	go h.BroadcastPrice(update)
}

// GetClientCount returns the number of connected clients
func (h *WebSocketHub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// GetCachedPrice returns the last cached price for a symbol
func (h *WebSocketHub) GetCachedPrice(symbol string) *PriceUpdate {
	h.cacheMu.RLock()
	defer h.cacheMu.RUnlock()
	return h.priceCache[symbol]
}

// HandlePriceStream handles WebSocket upgrade requests for price streaming
func (h *WebSocketHub) HandlePriceStream(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Create new client
	client := &WebSocketClient{
		hub:           h,
		conn:          conn,
		send:          make(chan []byte, 64),
		subscriptions: make(map[string]bool),
	}

	// Register client with hub
	h.register <- client

	// Start read and write goroutines
	go client.writePump()
	go client.readPump()
}

// isSubscribed checks if the client is subscribed to a symbol
func (c *WebSocketClient) isSubscribed(symbol string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.subscriptions[symbol]
}

// subscribe adds symbols to the client's subscription list
func (c *WebSocketClient) subscribe(symbols []string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, symbol := range symbols {
		c.subscriptions[symbol] = true
	}
	log.Printf("Client subscribed to: %v", symbols)
}

// unsubscribe removes symbols from the client's subscription list
func (c *WebSocketClient) unsubscribe(symbols []string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, symbol := range symbols {
		delete(c.subscriptions, symbol)
	}
	log.Printf("Client unsubscribed from: %v", symbols)
}

// readPump handles incoming messages from the WebSocket client
func (c *WebSocketClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// Set read deadline and pong handler
	c.conn.SetReadDeadline(time.Now().Add(c.hub.pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(c.hub.pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// Parse client message
		var clientMsg ClientMessage
		if err := json.Unmarshal(message, &clientMsg); err != nil {
			log.Printf("Error parsing client message: %v", err)
			continue
		}

		// Handle message action
		switch clientMsg.Action {
		case "subscribe":
			c.subscribe(clientMsg.Symbols)
			// Send cached prices for newly subscribed symbols
			c.hub.sendCachedPrices(c)
		case "unsubscribe":
			c.unsubscribe(clientMsg.Symbols)
		default:
			log.Printf("Unknown client action: %s", clientMsg.Action)
		}
	}
}

// writePump handles outgoing messages to the WebSocket client
func (c *WebSocketClient) writePump() {
	ticker := time.NewTicker(c.hub.pingInterval)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(c.hub.writeWait))
			if !ok {
				// Hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Batch any queued messages
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(c.hub.writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Close gracefully shuts down the hub
func (h *WebSocketHub) Close() {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Close all client connections
	for client := range h.clients {
		client.conn.Close()
		close(client.send)
		delete(h.clients, client)
	}
}
