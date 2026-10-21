
import { api } from "./api";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  role?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
  accessToken?: string;
  message?: string;
}

function saveAuthSession(response: AuthResponse) {
  const token = response.token ?? response.accessToken;

  if (token) {
    localStorage.setItem("jwt", token);
    localStorage.setItem("bednear_token", token);
  }

  if (response.user) {
    localStorage.setItem("bednear_user", JSON.stringify(response.user));
  }
}

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post<AuthResponse>("/auth/register", data);
    saveAuthSession(response.data);
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post<AuthResponse>("/auth/login", data);
    saveAuthSession(response.data);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get<{ user: AuthUser }>("/auth/me");
    return response.data.user;
  },

  logout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("bednear_token");
    localStorage.removeItem("bednear_user");
  },
};
