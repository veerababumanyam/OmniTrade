export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface TradeProposal {
    id: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    confidence_score: number;
    reasoning: string;
    proposed_by_model: string;
    status: ProposalStatus;
    created_at: string;
    updated_at: string;
}

export interface AuditLog {
    id: string;
    proposal_id: string;
    action_taken: string;
    user_id: string;
    metadata: string;
    executed_at: string;
}

export interface AuthResponse {
    token: string;
    refresh_token: string;
    expires_at: number;
    user_id: string;
    roles: string[];
}
