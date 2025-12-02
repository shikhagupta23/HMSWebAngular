import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';
import { ApiService } from '../../../shared/services/api-service';
import { AuthResponse } from '../models/auth.model';
import { safeStorage } from '../../../shared/utils/storage.util';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = inject(ApiService);
  private TOKEN_KEY = 'auth_token';
  private REFRESH_KEY = 'refresh_token';
  private USER_KEY = 'auth_user';

  login(payload: any): Observable<any> {
    return this.api.post(ApiEndpoints.AUTH.LOGIN, payload);
  }

  /** Save Auth Data */
  saveAuth(res: AuthResponse): void {
    const user = {
      userId: res.data.userId,
      userName: res.data.userName,
      hospitalId: res.data.hospitalId,
      hospitalName: res.data.hospitalName,
      hospitalImage: res.data.hospitalImage,
      featureList: res.data.featureList,
    };

    safeStorage.set(this.TOKEN_KEY, res.data.token);
    safeStorage.set(this.REFRESH_KEY, res.data.refreshToken);
    safeStorage.set(this.USER_KEY, JSON.stringify(user));
  }

  /** Get Stored Token */
  getToken(): string | null {
    return safeStorage.get(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return safeStorage.get(this.REFRESH_KEY);
  }

  getUser() {
    const user = safeStorage.get(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    safeStorage.remove(this.TOKEN_KEY);
    safeStorage.remove(this.REFRESH_KEY);
    safeStorage.remove(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    return (
      decoded[
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
      ] || null
    );
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedJson = atob(payload);
      return JSON.parse(decodedJson);
    } catch (e) {
      console.error('Invalid token', e);
      return null;
    }
  }

    /** Get Logged-in User ID */
  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
        || decoded['sub'] 
        || null;
  }

  getLoggedInUserId(): string | null {
    const user = this.getUser();
    return user ? user.userId : null;
  }

}
