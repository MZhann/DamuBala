// web/src/lib/api.ts
import type {
  AuthResponse,
  RegisterInput,
  LoginInput,
  User,
  Child,
  CreateChildInput,
  UpdateChildInput,
  GameSession,
  SaveGameSessionInput,
  GameSessionResponse,
  Achievement,
  EmotionRecord,
  AnalyticsSummary,
  Recommendation,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  // Auth endpoints
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    this.setToken(response.token);
    return response;
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    this.setToken(response.token);
    return response;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/me");
  }

  logout() {
    this.setToken(null);
  }

  // Children endpoints
  async getChildren(): Promise<{ children: Child[] }> {
    return this.request<{ children: Child[] }>("/children");
  }

  async getChild(id: string): Promise<{ child: Child }> {
    return this.request<{ child: Child }>(`/children/${id}`);
  }

  async createChild(input: CreateChildInput): Promise<{ message: string; child: Child }> {
    return this.request<{ message: string; child: Child }>("/children", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateChild(id: string, input: UpdateChildInput): Promise<{ message: string; child: Child }> {
    return this.request<{ message: string; child: Child }>(`/children/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async deleteChild(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/children/${id}`, {
      method: "DELETE",
    });
  }

  async verifyChildPin(id: string, pin: string): Promise<{ valid: boolean; child: Child }> {
    return this.request<{ valid: boolean; child: Child }>(`/children/${id}/verify-pin`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  }

  // Game endpoints
  async saveGameSession(input: SaveGameSessionInput): Promise<GameSessionResponse> {
    return this.request<GameSessionResponse>("/games/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getGameSessions(
    childId: string,
    options?: { limit?: number; offset?: number; gameKey?: string }
  ): Promise<{ sessions: GameSession[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    if (options?.gameKey) params.set("gameKey", options.gameKey);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ sessions: GameSession[]; total: number }>(
      `/games/sessions/${childId}${query}`
    );
  }

  async getAchievements(childId: string): Promise<{ achievements: Achievement[] }> {
    return this.request<{ achievements: Achievement[] }>(`/games/achievements/${childId}`);
  }

  // Emotion endpoints
  async saveEmotion(input: {
    childId: string;
    emotion: string;
    intensity: number;
    context?: string;
    gameSessionId?: string;
  }): Promise<{ message: string; emotion: EmotionRecord }> {
    return this.request<{ message: string; emotion: EmotionRecord }>("/emotions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getEmotions(
    childId: string,
    options?: { limit?: number; offset?: number; days?: number }
  ): Promise<{ emotions: EmotionRecord[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    if (options?.days) params.set("days", options.days.toString());
    
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ emotions: EmotionRecord[]; total: number }>(
      `/emotions/${childId}${query}`
    );
  }

  // Analytics endpoints
  async getAnalyticsSummary(childId: string, days?: number): Promise<AnalyticsSummary> {
    const query = days ? `?days=${days}` : "";
    return this.request<AnalyticsSummary>(`/analytics/summary/${childId}${query}`);
  }

  async getRecommendations(childId: string): Promise<{ recommendations: Recommendation[] }> {
    return this.request<{ recommendations: Recommendation[] }>(
      `/analytics/recommendations/${childId}`
    );
  }
}

export const api = new ApiClient();

