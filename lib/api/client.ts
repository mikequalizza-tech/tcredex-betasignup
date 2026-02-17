/**
 * tCredex Backend API Client
 *
 * This module provides typed access to the backend API services.
 * All business logic now runs on the backend - frontend just calls these APIs.
 */

import { getBackendApiUrl } from "../config/env-validation";

// Backend API base URL
const API_BASE_URL = getBackendApiUrl();

// =============================================================================
// TYPES
// =============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MatchScore {
  cdeId: string;
  cdeName: string;
  totalScore: number;
  breakdown: {
    geographic: number;
    sector: number;
    allocation: number;
    distress: number;
    historical: number;
  };
  matchStrength: "excellent" | "good" | "fair" | "weak";
  reasons: string[];
}

interface MatchResult {
  dealId: string;
  projectName: string;
  matches: MatchScore[];
  timestamp: string;
}

interface FeeBreakdown {
  tier1Amount: number;
  tier1Fee: number;
  tier2Amount: number;
  tier2Fee: number;
  totalFee: number;
  effectiveRate: number;
}

interface FeeResult {
  amount: number;
  fee: number;
  feeFormatted: string;
  effectiveRate: number;
  breakdown: FeeBreakdown;
}

interface DebarmentResult {
  name: string;
  isDebarred: boolean;
  checkedAt: string;
  details?: string;
  cacheHit?: boolean;
}

interface ExpiringTermSheet {
  id: string;
  dealId: string;
  dealName?: string;
  cdeName?: string;
  expiresAt: string;
  daysRemaining: number;
  expiryStatus: "expired" | "critical" | "warning" | "ok";
}

type DiscordChannelType = "TEXT" | "AUDIO" | "VIDEO";
type DiscordMemberRole = "ADMIN" | "MODERATOR" | "GUEST";

interface DiscordMember {
  id: string;
  userId: string;
  serverId: string;
  role: DiscordMemberRole;
  createdAt?: string | null;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: DiscordChannelType;
  serverId: string;
  description?: string | null;
  isPrivate?: boolean;
  createdAt?: string | null;
}

interface DiscordServer {
  id: string;
  name: string;
  imageUrl?: string | null;
  inviteCode?: string;
  ownerId?: string;
  organizationId?: string | null;
  dealId?: string | null;
  serverType?: string;
  createdAt?: string | null;
  channels: DiscordChannel[];
  members: DiscordMember[];
}

interface DiscordMessage {
  id: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  deleted?: boolean;
  edited?: boolean;
  memberId: string;
  channelId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  member?: DiscordMember;
}

interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string | null;
}

// =============================================================================
// API CLIENT
// =============================================================================

class BackendApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (!response.ok) {
          return {
            success: false,
            error: text || `HTTP ${response.status}`,
          };
        }
        // Non-JSON success response (unusual but handle it)
        return { success: true, data: text as unknown as T };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // ===========================================================================
  // HEALTH CHECK
  // ===========================================================================

  async health() {
    return this.request<{
      status: string;
      service: string;
      version: string;
      timestamp: string;
    }>("/api/health");
  }

  // ===========================================================================
  // AUTOMATCH
  // ===========================================================================

  async findMatches(
    dealId: string,
    options?: {
      minScore?: number;
      maxResults?: number;
      notifyMatches?: boolean;
    },
  ): Promise<ApiResponse<MatchResult>> {
    return this.request<MatchResult>("/api/automatch", {
      method: "POST",
      body: JSON.stringify({ dealId, options }),
    });
  }

  async runAutoMatchBatch(): Promise<
    ApiResponse<{ processed: number; matches: number }>
  > {
    return this.request("/api/automatch", {
      method: "POST",
      body: JSON.stringify({ action: "batch" }),
    });
  }

  // ===========================================================================
  // SCORING
  // ===========================================================================

  async calculateScore(input: unknown, cdeCriteria?: unknown) {
    return this.request("/api/scoring", {
      method: "POST",
      body: JSON.stringify({ input, cdeCriteria }),
    });
  }

  async calculateBatchScores(inputs: unknown[], cdeCriteria?: unknown) {
    return this.request("/api/scoring", {
      method: "POST",
      body: JSON.stringify({ action: "batch", inputs, cdeCriteria }),
    });
  }

  // ===========================================================================
  // DEAL STATUS
  // ===========================================================================

  async getStatusDefinitions() {
    return this.request("/api/deals/status");
  }

  async getStatusInfo(status: string, role?: string) {
    const params = new URLSearchParams({ status });
    if (role) params.append("role", role);
    return this.request(`/api/deals/status?${params}`);
  }

  async validateTransition(
    currentStatus: string,
    newStatus: string,
    userRole: string,
  ) {
    return this.request("/api/deals/status", {
      method: "POST",
      body: JSON.stringify({ currentStatus, newStatus, userRole }),
    });
  }

  async executeTransition(
    dealId: string,
    currentStatus: string,
    newStatus: string,
    userRole: string,
    userId: string,
  ) {
    return this.request("/api/deals/status", {
      method: "POST",
      body: JSON.stringify({
        dealId,
        currentStatus,
        newStatus,
        userRole,
        userId,
        execute: true,
      }),
    });
  }

  // ===========================================================================
  // CLOSING FEES
  // ===========================================================================

  async calculateClosingFee(amount: number): Promise<ApiResponse<FeeResult>> {
    return this.request<FeeResult>("/api/closing", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async calculateClosingFees(
    amounts: number[],
  ): Promise<ApiResponse<FeeResult[]>> {
    return this.request<FeeResult[]>("/api/closing", {
      method: "POST",
      body: JSON.stringify({ amounts }),
    });
  }

  async getFeeSchedule() {
    return this.request("/api/closing");
  }

  // ===========================================================================
  // COMPLIANCE - DEBARMENT
  // ===========================================================================

  async checkDebarment(
    name: string,
    options?: {
      entityId?: string;
      entityType?: string;
      forceRefresh?: boolean;
    },
  ): Promise<ApiResponse<DebarmentResult>> {
    return this.request<DebarmentResult>("/api/compliance/debarment", {
      method: "POST",
      body: JSON.stringify({ name, ...options }),
    });
  }

  async checkDebarmentMultiple(
    names: string[],
    options?: {
      entityId?: string;
      entityType?: string;
      forceRefresh?: boolean;
    },
  ): Promise<
    ApiResponse<{
      results: DebarmentResult[];
      summary: {
        total: number;
        clear: number;
        flagged: number;
        hasDebarred: boolean;
      };
    }>
  > {
    return this.request("/api/compliance/debarment", {
      method: "POST",
      body: JSON.stringify({ names, ...options }),
    });
  }

  // ===========================================================================
  // COMPLIANCE - TERM SHEETS
  // ===========================================================================

  async getExpiringTermSheets(thresholdDays: number = 7): Promise<
    ApiResponse<{
      thresholdDays: number;
      summary: {
        total: number;
        expired: number;
        critical: number;
        warning: number;
      };
      expiring: ExpiringTermSheet[];
    }>
  > {
    return this.request(`/api/compliance/term-sheets?days=${thresholdDays}`);
  }

  async autoExpireTermSheets(): Promise<
    ApiResponse<{
      action: string;
      expiredCount: number;
      affectedDeals: string[];
    }>
  > {
    return this.request("/api/compliance/term-sheets", {
      method: "POST",
      body: JSON.stringify({ action: "auto-expire" }),
    });
  }

  // ===========================================================================
  // DEALS
  // ===========================================================================

  async getDeals(filters?: {
    project_type?: string;
    state?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const queryString = params.toString();
    return this.request(`/api/deals${queryString ? `?${queryString}` : ""}`);
  }

  async getDealById(id: string) {
    return this.request(`/api/deals/${id}`);
  }

  async getDealsByOrganization(
    orgId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ) {
    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const queryString = params.toString();
    return this.request(
      `/api/deals/by-organization/${orgId}${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getMarketplace(filters?: {
    project_type?: string;
    state?: string;
    tier?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const queryString = params.toString();
    return this.request(
      `/api/deals/marketplace${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getDealStats(organizationId?: string) {
    const params = organizationId ? `?organizationId=${organizationId}` : "";
    return this.request(`/api/deals/stats${params}`);
  }

  async createDeal(dealData: Record<string, unknown>) {
    return this.request("/api/deals", {
      method: "POST",
      body: JSON.stringify(dealData),
    });
  }

  async updateDeal(id: string, dealData: Record<string, unknown>) {
    return this.request(`/api/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(dealData),
    });
  }

  async updateDealStatus(id: string, status: string, userId?: string) {
    return this.request(`/api/deals/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, userId }),
    });
  }

  // ===========================================================================
  // CDEs
  // ===========================================================================

  async getCDEs(filters?: { status?: string }) {
    const params = filters?.status ? `?status=${filters.status}` : "";
    return this.request(`/api/cdes${params}`);
  }

  async getCDEById(id: string) {
    return this.request(`/api/cdes/${id}`);
  }

  // ===========================================================================
  // INTAKE
  // ===========================================================================

  async submitIntake(intakeData: Record<string, unknown>) {
    return this.request("/api/intake", {
      method: "POST",
      body: JSON.stringify(intakeData),
    });
  }

  async getIntakeStatus(dealId: string) {
    return this.request(`/api/intake/${dealId}`);
  }

  // ===========================================================================
  // DISCORD - Servers
  // ===========================================================================

  async createServer(data: {
    name: string;
    organizationId?: string;
    dealId?: string;
    createdByUserId: string;
  }) {
    return this.request("/api/discord/servers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getServer(id: string): Promise<ApiResponse<DiscordServer>> {
    return this.request<DiscordServer>(`/api/discord/servers/${id}`);
  }

  async getServerByInviteCode(
    code: string,
  ): Promise<ApiResponse<DiscordServer>> {
    return this.request<DiscordServer>(`/api/discord/servers/invite/${code}`);
  }

  async getDiscordServersByUser(
    userId: string,
  ): Promise<ApiResponse<DiscordServer[]>> {
    return this.getUserServers(userId);
  }

  async getUserServers(userId: string): Promise<ApiResponse<DiscordServer[]>> {
    return this.request<DiscordServer[]>(
      `/api/discord/users/${userId}/servers`,
    );
  }

  async getOrganizationServers(
    orgId: string,
  ): Promise<ApiResponse<DiscordServer[]>> {
    return this.request<DiscordServer[]>(
      `/api/discord/organizations/${orgId}/servers`,
    );
  }

  async getDealServers(dealId: string): Promise<ApiResponse<DiscordServer[]>> {
    return this.request<DiscordServer[]>(
      `/api/discord/deals/${dealId}/servers`,
    );
  }

  async updateServer(
    id: string,
    data: { name?: string; imageUrl?: string },
  ): Promise<ApiResponse<DiscordServer>> {
    return this.request<DiscordServer>(`/api/discord/servers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async generateInviteCode(serverId: string) {
    return this.request(`/api/discord/servers/${serverId}/invite-code`, {
      method: "POST",
    });
  }

  async deleteServer(id: string) {
    return this.request(`/api/discord/servers/${id}`, {
      method: "DELETE",
    });
  }

  // ===========================================================================
  // DISCORD - Channels
  // ===========================================================================

  async createChannel(data: {
    name: string;
    type: "TEXT" | "AUDIO" | "VIDEO";
    serverId: string;
  }): Promise<ApiResponse<DiscordChannel>> {
    return this.request<DiscordChannel>("/api/discord/channels", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getServerChannels(
    serverId: string,
  ): Promise<ApiResponse<DiscordChannel[]>> {
    return this.request<DiscordChannel[]>(
      `/api/discord/servers/${serverId}/channels`,
    );
  }

  async updateChannel(
    id: string,
    data: { name?: string },
  ): Promise<ApiResponse<DiscordChannel>> {
    return this.request<DiscordChannel>(`/api/discord/channels/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteChannel(id: string) {
    return this.request(`/api/discord/channels/${id}`, {
      method: "DELETE",
    });
  }

  // ===========================================================================
  // DISCORD - Members
  // ===========================================================================

  async addMember(data: {
    serverId: string;
    userId: string;
    role?: "ADMIN" | "MODERATOR" | "GUEST";
  }): Promise<ApiResponse<DiscordMember>> {
    return this.request<DiscordMember>("/api/discord/members", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async joinServerByInvite(
    inviteCode: string,
    userId: string,
  ): Promise<ApiResponse<DiscordMember>> {
    return this.request<DiscordMember>(
      `/api/discord/servers/join/${inviteCode}`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
  }

  async updateMemberRole(
    memberId: string,
    role: "ADMIN" | "MODERATOR" | "GUEST",
  ): Promise<ApiResponse<DiscordMember>> {
    return this.request<DiscordMember>(
      `/api/discord/members/${memberId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
  }

  async removeMember(serverId: string, userId: string) {
    return this.request(`/api/discord/servers/${serverId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  async leaveServer(serverId: string, userId: string) {
    return this.request(`/api/discord/servers/${serverId}/leave`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // ===========================================================================
  // DISCORD - Messages
  // ===========================================================================

  async sendMessage(data: {
    content: string;
    channelId: string;
    memberId: string;
    fileUrl?: string;
  }): Promise<ApiResponse<DiscordMessage>> {
    return this.request<DiscordMessage>("/api/discord/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendDiscordMessage(data: {
    content: string;
    channelId: string;
    memberId: string;
    fileUrl?: string;
  }): Promise<ApiResponse<DiscordMessage>> {
    return this.sendMessage(data);
  }

  async getChannelMessages(
    channelId: string,
    cursor?: string,
  ): Promise<
    ApiResponse<{ messages: DiscordMessage[]; nextCursor: string | null }>
  > {
    const params = cursor ? `?cursor=${cursor}` : "";
    return this.request<{
      messages: DiscordMessage[];
      nextCursor: string | null;
    }>(`/api/discord/channels/${channelId}/messages${params}`);
  }

  async getDiscordChannelMessages(
    channelId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<
    ApiResponse<{ messages: DiscordMessage[]; nextCursor: string | null }>
  > {
    const params = new URLSearchParams();
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", String(options.limit));
    const query = params.toString();
    return this.request(
      `/api/discord/channels/${channelId}/messages${query ? `?${query}` : ""}`,
    );
  }

  async updateMessage(
    id: string,
    content: string,
  ): Promise<ApiResponse<DiscordMessage>> {
    return this.request<DiscordMessage>(`/api/discord/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(id: string) {
    return this.request(`/api/discord/messages/${id}`, {
      method: "DELETE",
    });
  }

  // ===========================================================================
  // DISCORD - Direct Messages & Conversations
  // ===========================================================================

  async createConversation(memberOneId: string, memberTwoId: string) {
    return this.request("/api/discord/conversations", {
      method: "POST",
      body: JSON.stringify({ memberOneId, memberTwoId }),
    });
  }

  async getMemberConversations(memberId: string) {
    return this.request(`/api/discord/members/${memberId}/conversations`);
  }

  async sendDirectMessage(data: {
    content: string;
    conversationId: string;
    memberId: string;
    fileUrl?: string;
  }) {
    return this.request("/api/discord/direct-messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getConversationMessages(conversationId: string, cursor?: string) {
    const params = cursor ? `?cursor=${cursor}` : "";
    return this.request(
      `/api/discord/conversations/${conversationId}/messages${params}`,
    );
  }

  // ===========================================================================
  // SCORING
  // ===========================================================================

  async calculateSectionCScore(
    dealId: string,
    dealData?: Record<string, unknown>,
  ) {
    return this.request("/api/scoring/section-c", {
      method: "POST",
      body: JSON.stringify({ dealId, dealData }),
    });
  }

  async checkQALICBEligibility(dealData: Record<string, unknown>) {
    return this.request("/api/scoring/qalicb", {
      method: "POST",
      body: JSON.stringify(dealData),
    });
  }

  // ===========================================================================
  // AUTOMATCH
  // ===========================================================================

  async findCDEMatches(
    dealId: string,
    options?: {
      minScore?: number;
      maxResults?: number;
    },
  ) {
    return this.request("/api/automatch/find", {
      method: "POST",
      body: JSON.stringify({ dealId, ...options }),
    });
  }

  // ===========================================================================
  // GEO
  // ===========================================================================

  async resolveTract(address: string) {
    return this.request(
      `/api/geo/resolve-tract?address=${encodeURIComponent(address)}`,
    );
  }

  async getTractEligibility(censusTract: string) {
    return this.request(`/api/geo/eligibility/${censusTract}`);
  }

  async getStates() {
    return this.request("/api/geo/states");
  }

  // ===========================================================================
  // PDF Generation
  // ===========================================================================

  async generateDealProfile(dealId: string) {
    return this.request("/api/pdf/deal-profile", {
      method: "POST",
      body: JSON.stringify({ dealId }),
    });
  }

  async generateTermSheet(dealId: string, cdeId: string) {
    return this.request("/api/pdf/term-sheet", {
      method: "POST",
      body: JSON.stringify({ dealId, cdeId }),
    });
  }

  async generateLOI(loiId: string) {
    return this.request("/api/pdf/loi", {
      method: "POST",
      body: JSON.stringify({ loiId }),
    });
  }

  async generateCommitmentLetter(commitmentId: string) {
    return this.request("/api/pdf/commitment-letter", {
      method: "POST",
      body: JSON.stringify({ commitmentId }),
    });
  }

  async generateClosingChecklist(dealId: string) {
    return this.request("/api/pdf/closing-checklist", {
      method: "POST",
      body: JSON.stringify({ dealId }),
    });
  }

  async generateComplianceReport(dealId: string) {
    return this.request("/api/pdf/compliance-report", {
      method: "POST",
      body: JSON.stringify({ dealId }),
    });
  }

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  async getNotifications(
    userId: string,
    options?: { page?: number; limit?: number; unreadOnly?: boolean },
  ): Promise<ApiResponse<{ notifications: NotificationData[] }>> {
    const params = new URLSearchParams({ userId });
    if (options?.page) params.append("page", String(options.page));
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.unreadOnly !== undefined) {
      params.append("unreadOnly", String(options.unreadOnly));
    }

    const result = await this.request<NotificationData[]>(
      `/api/notifications?${params.toString()}`,
    );
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: { notifications: result.data || [] },
    };
  }

  async markNotificationAsRead(id: string, userId: string) {
    return this.request(`/api/notifications/${id}/read`, {
      method: "PUT",
      body: JSON.stringify({ userId }),
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Singleton instance
export const api = new BackendApiClient();

// Class export for custom instances
export { BackendApiClient };

// Type exports
export type {
  ApiResponse,
  MatchScore,
  MatchResult,
  FeeBreakdown,
  FeeResult,
  DebarmentResult,
  ExpiringTermSheet,
  DiscordServer,
  DiscordChannel,
  DiscordMessage,
  NotificationData,
};
