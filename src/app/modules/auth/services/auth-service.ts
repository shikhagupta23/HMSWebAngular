import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';
import { ApiService } from '../../../shared/services/api-service';
import { AuthResponse } from '../models/auth.model';
import { safeStorage } from '../../../shared/utils/storage.util';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(this.getUser());
  user$ = this.userSubject.asObservable();
  
  // Logout event subject for browser close detection
  private logoutSubject = new Subject<void>();
  public logoutEvent$ = this.logoutSubject.asObservable();
  
  private api = inject(ApiService);
  private router = inject(Router);
  private TOKEN_KEY = 'auth_token';
  private REFRESH_KEY = 'refresh_token';
  private USER_KEY = 'auth_user';
  
  private _ = (() => {
    const user = this.getUser();
    if (user) {
      this.userSubject.next(user);
    }
  })();

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

    // 🔥 IMPORTANT
    this.setUser(user);
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

    if (!user) return null;

    // already parsed
    if (typeof user === 'object') {
      return user;
    }

    // stringified
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }

  logout(): void {
    // Emit logout event before clearing data
    this.logoutSubject.next();
    
    safeStorage.remove(this.TOKEN_KEY);
    safeStorage.remove(this.REFRESH_KEY);
    safeStorage.remove(this.USER_KEY);
    
    // Clear browser close flags
    safeStorage.remove('closedWithoutLogout');
    safeStorage.remove('closeTime');
    
    this.router.navigate(['/auth']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Alias method for compatibility */
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  /** 
   * Notify backend when browser closes without logout
   * Currently disabled - enable when backend endpoint is ready
   */
  notifyBrowserClose(): void {
    // Currently not logging to backend
    // Uncomment below when backend endpoint is ready
    
    /*
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user) {
      const data = JSON.stringify({ 
        userId: user.userId,
        userName: user.userName,
        hospitalId: user.hospitalId,
        token: token,
        action: 'browser_closed',
        timestamp: new Date().toISOString()
      });
      
      // Use sendBeacon for reliability - it works even when page is closing
      navigator.sendBeacon(
        `${window.location.origin}/api/Auth/browser-close`, 
        new Blob([data], { type: 'application/json' })
      );
    }
    */
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

  forgotPassword(phoneNumber: string): Observable<any> {
    return this.api.post(
      ApiEndpoints.AUTH.FORGOT_PASSWORD,
      null, // body must be null
      {
        params: {
          userid: phoneNumber
        }
      }
    );
  }

  verifyOtp(phoneNumber: string, otp: string): Observable<any> {
    return this.api.get(
      ApiEndpoints.AUTH.VERIFY_OTP,
      {
        userId: phoneNumber,
        otp: otp
      }
    );
  }

  updateUserName(userName: string): void {
    const user = this.getUser();
    if (!user) return;

    const updatedUser = {
      ...user,
      userName
    };

    this.setUser(updatedUser);
  }

  setUser(user: any): void {
    safeStorage.set(this.USER_KEY, user);
    this.userSubject.next(user);
  }

  get currentUser(): any {
    return this.userSubject.value;
  }

  get featureList(): any[] {
    return this.currentUser?.featureList ?? [];
  }

  hasFeature(featureKey: string): boolean {
    const user = this.getUser();
    if (!user || !user.featureList) return false;

    return user.featureList.some(
      (f: any) =>
        f.featureUniqueKey === featureKey && f.isAccess === true
    );
  }

  get role(): string | null {
    return this.getUserRole();
  }

  canExtend(featureKey: string): boolean {
    const user = this.getUser();
    if (!user || !user.featureList) return false;

    return user.featureList.some(
      (f: any) =>
        f.featureUniqueKey === featureKey &&
        f.isAccess === true &&
        f.isExtend === true
    );
  }

  hasAnyExtendableFeature(): boolean {
    const user = this.getUser();
    if (!user || !user.featureList) return false;

    return user.featureList.some(
      (f: any) => f.isAccess === true && f.isExtend === true
    );
  }
}