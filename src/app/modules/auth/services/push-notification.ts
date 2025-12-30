import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken
} from 'firebase/messaging';
import { ToastService } from '../../../shared/services/toast-service';
import { environment } from '../../../../environment/environment.delvelopment';
import { ApiEndpoints } from '../../../shared/constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class PushNotification {
    private messaging;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {
    // Initialize Firebase once
    const app = initializeApp(environment.firebase);
    this.messaging = getMessaging(app);
  }

  /**
   * Call AFTER successful login
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();

      navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => console.log('SW registered', reg))
      .catch(err => console.error('SW register failed', err));

      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey
      });

      if (token) {
        this.saveToken(token);
      }
    } catch (err) {
      console.error('FCM permission error', err);
    }
  }

  /**
   * Save token in backend
   */
  private saveToken(token: string) {
    this.http.post(ApiEndpoints.NOTIFICATION.SAVE_TOKEN, { token })
      .subscribe({
        error: err => console.error('Save token failed', err)
    });
  }

  /**
   * Foreground notification (when app is open)
   */
  // listen() {
  //   onMessage(this.messaging, payload => {
  //     console.log('Foreground notification:', payload);

  //     const title = payload.notification?.title || 'Notification';
  //     const body = payload.notification?.body || '';

  //     this.toast.info(body, title);
  //   });
  // }

  /**
   * Call on LOGOUT
   */
async removeToken() {
  try {
    const token = await getToken(this.messaging);

    if (token) {
      await deleteToken(this.messaging);

      this.http.post(ApiEndpoints.NOTIFICATION.REMOVE_TOKEN, { token })
        .subscribe();
    }
  } catch (err) {
    console.error('Remove token failed', err);
  }
}

}
