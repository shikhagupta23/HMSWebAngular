import { Inject, Injectable } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ApiEndpoints } from '../constants/api-endpoints';
import { ToastService } from './toast-service';

@Injectable({ providedIn: 'root' })
export class FcmService {

  constructor(
    private messaging: Messaging,
    private http: HttpClient,
    private toastService: ToastService

  ) {}

  async requestPermission() {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey
      });

      if (token) {
        localStorage.setItem('fcmToken', token);
        this.saveToken(token);
      }
    }
  }

  saveToken(token: string) {
    return this.http.post(
      ApiEndpoints.USER_DEVICE.REGISTER,
      { deviceToken: token }
    ).subscribe({
      next: () => console.log('FCM token registered'),
      error: err => console.error('FCM token save failed', err)
    });
  }

  listen() {
    onMessage(this.messaging, payload => {
      console.log('Foreground notification:', payload);
      const notification = payload.notification;

      if (notification) {
        this.toastService.success(
          `${notification.title ?? 'Notification'} - ${notification.body ?? ''}`
        );
      }
    });
  }

}
