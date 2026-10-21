import { api } from "./api";

export interface OwnerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  role: string;
  createdAt?: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  businessName?: string | null;
}

export async function getProfile(): Promise<OwnerProfile> {
  const response = await api.get("/profile");
  return response.data.user;
}

export async function updateProfile(
  data: UpdateProfileInput
): Promise<OwnerProfile> {
  const response = await api.patch("/profile", data);
  return response.data.user;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<string> {
  const response = await api.patch("/profile/password", data);
  return response.data.message;
}