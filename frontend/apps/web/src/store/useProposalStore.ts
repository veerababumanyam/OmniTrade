import { create } from 'zustand';
import type { TradeProposal } from '../types/api';
import api from '../api/client';

interface ProposalState {
    proposals: TradeProposal[];
    isLoading: boolean;
    error: string | null;
    fetchProposals: (status?: string) => Promise<void>;
    approveProposal: (id: string) => Promise<void>;
    rejectProposal: (id: string) => Promise<void>;
}

export const useProposalStore = create<ProposalState>((set) => ({
    proposals: [],
    isLoading: false,
    error: null,

    fetchProposals: async (status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get<TradeProposal[]>('/proposals', {
                params: { status },
            });
            // Ensure we always have an array
            const proposals = Array.isArray(response.data) ? response.data : [];
            set({ proposals, isLoading: false });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals';
            set({ error: errorMessage, isLoading: false, proposals: [] });
        }
    },

    approveProposal: async (id) => {
        try {
            await api.post(`/proposals/${id}/approve`);
            // Optimistic update or refetch
            set((state) => ({
                proposals: state.proposals.map((p) =>
                    p.id === id ? { ...p, status: 'APPROVED' as const } : p
                ),
            }));
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    rejectProposal: async (id) => {
        try {
            await api.post(`/proposals/${id}/reject`);
            set((state) => ({
                proposals: state.proposals.map((p) =>
                    p.id === id ? { ...p, status: 'REJECTED' as const } : p
                ),
            }));
        } catch (err: any) {
            set({ error: err.message });
        }
    },
}));
