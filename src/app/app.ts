import { Component, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NotificationService } from './shared/services/notification-service';
import { AuthService } from './modules/auth/services/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('HMSWeb');
  private isLoggedOut = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    console.log('App Component initialized');
  }

  async ngOnInit() {
    console.log('App ngOnInit called');
    
    // Register Service Worker
    await this.registerServiceWorker();
    
    // Request notification permission when app starts
    await this.notificationService.requestPermission();
    
    // Subscribe to logout events
    this.authService.logoutEvent$.subscribe(() => {
      console.log('Logout event received');
      this.isLoggedOut = true;
    });

    // Check if user closed browser without logout in previous session
    this.checkPreviousSession();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', this.serviceWorkerRegistration);
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Workers not supported in this browser');
    }
  }

  private checkPreviousSession() {
    console.log('Checking previous session...');
    const closedWithoutLogout = localStorage.getItem('closedWithoutLogout');
    const closeTime = localStorage.getItem('closeTime');
    
    console.log('closedWithoutLogout:', closedWithoutLogout);
    console.log('closeTime:', closeTime);
    
    if (closedWithoutLogout === 'true' && closeTime) {
      const user = this.authService.getUser();
      const userName = user?.userName || 'User';
      
      console.log('Previous session found, showing notification...');
      
      // Clear flags FIRST
      localStorage.removeItem('closedWithoutLogout');
      localStorage.removeItem('closeTime');
      
      // Show notification about previous session
      setTimeout(() => {
        this.notificationService.showNotification(
          'Previous Session Alert',
          {
            body: `${userName}, you closed the browser without logging out at ${new Date(closeTime).toLocaleString()}`,
            requireInteraction: true
          }
        );
      }, 2000);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    console.log('🚪 beforeunload fired');
    console.log('   isAuthenticated:', this.authService.isAuthenticated());
    console.log('   isLoggedOut:', this.isLoggedOut);
    
    if (this.authService.isAuthenticated() && !this.isLoggedOut) {
      console.log('✅ User closing without logout');
      
      // Save to localStorage
      localStorage.setItem('closedWithoutLogout', 'true');
      localStorage.setItem('closeTime', new Date().toISOString());
      console.log('💾 Saved to localStorage');
      
      // Send message to Service Worker for immediate notification
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        console.log('📤 Sending notification request to Service Worker...');
        this.serviceWorkerRegistration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: '⚠️ Browser Closed Without Logout',
          body: 'For security, please logout before closing the browser.',
          tag: 'browser-close-' + Date.now()
        });
      }
      
      // Show browser dialog
      event.preventDefault();
      event.returnValue = 'You are still logged in. Are you sure?';
      return event.returnValue;
    }
  }

  ngOnDestroy() {
    console.log('App component destroyed');
  }
}