import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private permissionGranted = false;

  constructor() {
    console.log('🔔 NotificationService initialized');
    this.requestPermission();
  }

  /** Request notification permission when app loads */
  async requestPermission(): Promise<void> {
    console.log('📢 Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.error('❌ Browser does not support notifications');
      return;
    }

    console.log('📊 Current permission:', Notification.permission);

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      console.log('✅ Permission already granted');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      console.log('📋 Permission result:', permission);
    }
  }

  /** Show desktop notification */
  showNotification(title: string, options?: NotificationOptions): void {
    console.log('🔔 Attempting to show notification:', title);
    console.log('   Permission granted:', this.permissionGranted);
    console.log('   Notification.permission:', Notification.permission);

    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported');
      return;
    }

    // Always check current permission status
    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Permission not granted, requesting...');
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.permissionGranted = true;
          this.createNotification(title, options);
        }
      });
      return;
    }

    this.createNotification(title, options);
  }

  private createNotification(title: string, options?: NotificationOptions): void {
    try {
      console.log('✅ Creating notification now...');
      
      // Remove icon/badge if they don't exist
      const notificationOptions: NotificationOptions = {
        ...options
      };
      
      // Remove icon/badge to prevent 404 errors
      delete notificationOptions.icon;
      delete notificationOptions.badge;
      
      const notification = new Notification(title, notificationOptions);

      console.log('✅ Notification created successfully');

      // Auto close after 10 seconds if not set to requireInteraction
      if (!options?.requireInteraction) {
        setTimeout(() => {
          console.log('⏰ Auto-closing notification');
          notification.close();
        }, 10000);
      }

      // Handle notification click
      notification.onclick = () => {
        console.log('👆 Notification clicked');
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
      };

      notification.onshow = () => {
        console.log('👁️ Notification shown');
      };

      notification.onclose = () => {
        console.log('🚪 Notification closed');
      };

    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  /** Show browser close warning notification */
  showBrowserCloseWarning(): void {
    console.log('⚠️ showBrowserCloseWarning called');
    this.showNotification(
      'You closed the browser without logging out!',
      {
        body: 'For security reasons, please logout before closing the browser next time.',
        tag: 'browser-close-warning',
        requireInteraction: true
      }
    );
  }

  /** Check if permission is granted */
  isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  /** Get current permission status */
  getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }
}