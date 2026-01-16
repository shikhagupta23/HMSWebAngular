// notification-prompt.component.ts
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification-service';

@Component({
  selector: 'app-notification-prompt',
  templateUrl: './notification-prompt.html',
  styleUrls: ['./notification-prompt.scss'],
  standalone: false
})
export class NotificationPromptComponent implements OnInit {
  showPrompt = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Show prompt if notification permission not granted
    if ('Notification' in window && Notification.permission === 'default') {
      // Show after 2 seconds
      setTimeout(() => {
        const dismissed = localStorage.getItem('notificationPromptDismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        
        // Show if never dismissed or dismissed more than 7 days ago
        if (!dismissed || daysSinceDismissed > 7) {
          this.showPrompt = true;
        }
      }, 2000);
    }
  }

  async enableNotifications() {
    await this.notificationService.requestPermission();
    this.showPrompt = false;
    
    // Show test notification if permission granted
    if (this.notificationService.isPermissionGranted()) {
      this.notificationService.showNotification(
        'Notifications Enabled!',
        { body: 'You will now receive security alerts.' }
      );
    }
  }

  dismissPrompt() {
    this.showPrompt = false;
    // Ask again in 7 days
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
  }
}