export interface AuthResponse {
  data: AuthData;
  isSuccess: boolean;
  message: string;
  id?: string;
}

export interface AuthData {
  userId: string;
  userName: string;
  hospitalId: string;
  hospitalName: string;
  userRole: string;
  token: string;
  refreshToken: string;
  hospitalImage: string;
  featureList: any[];
}
