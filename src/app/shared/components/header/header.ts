import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { Router } from '@angular/router';
import { NotificationService, NotificationModel } from '../../services/notification.service';
import { SignalRService } from '../../services/signal-rservice';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header-common',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private signalRService = inject(SignalRService);
  
  private destroy$ = new Subject<void>();
  
  showProfileMenu = false;
  role = this.auth.getUserRole();
  user$ = this.auth.user$;

  // Notification properties
  showNotificationDropdown = false;
  notifications: NotificationModel[] = [];
  unreadCount = 0;
  loadingNotifications = false;

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
    this.setupSignalR();
    
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationService.getMyNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.notifications = response.data;
          }
          this.loadingNotifications = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.loadingNotifications = false;
        }
      });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.unreadCount = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading unread count:', error);
        }
      });
  }

  setupSignalR(): void {
    this.signalRService.connect();
    
    this.signalRService.onReceiveNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        console.log('New notification received:', notification);
        
        const newNotification: NotificationModel = {
          id: 0,
          notificationMasterId: 0,
          isSend: true,
          hospitalId: notification.hospitalId || '',
          isDeleted: false,
          userId: null,
          targetRole: null,
          title: notification.title,
          message: notification.message,
          isRead: false,
          level: this.getLevelFromString(notification.level),
          createdAt: notification.createdAt || new Date().toISOString(),
          updatedAt: notification.createdAt || new Date().toISOString()
        };
        
        this.notifications.unshift(newNotification);
        this.unreadCount++;
        this.showBrowserNotification(notification);
        this.playNotificationSound();
        
        setTimeout(() => this.loadNotifications(), 1000);
      });
  }

  getLevelFromString(level: string): number {
    const levelMap: { [key: string]: number } = {
      'Info': 1,
      'Warning': 2,
      'Error': 3,
      'Critical': 4
    };
    return levelMap[level] || 1;
  }

  toggleNotificationDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.showNotificationDropdown = !this.showNotificationDropdown;
    
    if (this.showNotificationDropdown) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: NotificationModel): void {
    if (notification.isRead || notification.id === 0) return;

    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            notification.isRead = true;
            this.notificationService.decrementUnreadCount();
          }
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  markAllAsRead(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.notifications.forEach(n => n.isRead = true);
            this.notificationService.updateUnreadCount(0);
          }
        },
        error: (error) => {
          console.error('Error marking all as read:', error);
        }
      });
  }

  deleteNotification(notification: NotificationModel, event: Event): void {
    event.stopPropagation();

    if (notification.id === 0) {
      this.notifications = this.notifications.filter(n => n !== notification);
      return;
    }

    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.notifications = this.notifications.filter(n => n.id !== notification.id);
            
            if (!notification.isRead) {
              this.notificationService.decrementUnreadCount();
            }
          }
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  showBrowserNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/img/notification-icon.png',
        badge: '/assets/img/badge-icon.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(notification);
        }
      });
    }
  }

  playNotificationSound(): void {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.log('Could not play notification sound:', error);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.notification-bell-wrapper') || 
                          target.closest('.notification-dropdown');
    
    if (!clickedInside && this.showNotificationDropdown) {
      this.showNotificationDropdown = false;
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.auth.logout();
  }

  navigateByRole(): void {
    const role = this.auth.getUserRole()?.toLowerCase();

    if (!role) {
      this.router.navigate(['/auth']);
      return;
    }

    if (role === 'doctor' || role === 'receptionist') {
      this.router.navigate(['/dashboard']);
    }
    else if (role === 'admin' || role === 'superadmin') {
      this.router.navigate(['/superadmin']);
    }
    else {
      this.router.navigate(['/']);
    }
  }
}