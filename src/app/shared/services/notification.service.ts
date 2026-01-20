import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

// ✅ Renamed from Notification to NotificationModel
export interface NotificationModel {
  id: number;
  notificationMasterId: number;
  isSend: boolean;
  hospitalId: string;
  isDeleted: boolean;
  userId: string | null;
  targetRole: string | null;
  title: string;
  message: string;
  isRead: boolean;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.baseUrl}/notificationapi`;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications for logged-in user
   */
  getMyNotifications(): Observable<ApiResponse<NotificationModel[]>> {  // ✅ Changed
    return this.http.get<ApiResponse<NotificationModel[]>>(`${this.apiUrl}/my-notifications`);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => {
        if (response.isSuccess) {
          this.unreadCountSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Mark single notification as read
   */
  markAsRead(notificationId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/mark-read/${notificationId}`, 
      {}
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/mark-all-read`, {});
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${notificationId}`);
  }

  /**
   * Update unread count manually
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  /**
   * Decrement unread count by 1
   */
  decrementUnreadCount(): void {
    const currentCount = this.unreadCountSubject.value;
    if (currentCount > 0) {
      this.unreadCountSubject.next(currentCount - 1);
    }
  }

  incrementUnreadCount(): void {
    const currentCount = this.unreadCountSubject.value;
    this.unreadCountSubject.next(currentCount + 1);
  }
}