import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // ✅ singleton
})
export class SignalRService {

  private hubConnection!: signalR.HubConnection;

  // 🔔 Subjects for events
  private receiveCompleted$ = new Subject<any>();
  private receiveCheckIn$ = new Subject<any>();
  private appointmentBooked$ = new Subject<any>();

  // 🔗 Hub URL
  private readonly hubUrl =
    'https://api-clinicmanagement.rsdemoprojects.in/patientHub';

  constructor() {}

  /* ================================
     JWT → ROLE EXTRACTION
  ================================= */
  private getRoleFromToken(): string | null {
    const token = localStorage.getItem('token'); // adjust key if needed
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Common role claim keys
      return (
        payload.role ||
        payload.Role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        null
      );
    } catch (e) {
      console.error('Invalid JWT token', e);
      return null;
    }
  }

  /* ================================
     CONNECT TO SIGNALR
  ================================= */
  async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const role = this.getRoleFromToken();
    if (!role) {
      console.warn('Role not found, SignalR not connected');
      return;
    }

    const hubUrlWithRole = `${this.hubUrl}?role=${encodeURIComponent(role)}`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrlWithRole, {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
        withCredentials: false
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 🔔 Register server events
    this.registerHubEvents();

    try {
      console.log('Connecting to SignalR:', hubUrlWithRole);
      await this.hubConnection.start();
      console.log('✅ SignalR connected');
    } catch (err) {
      console.error('❌ SignalR connection failed', err);
    }

    // 🔁 Lifecycle logs
    this.hubConnection.onreconnecting(err =>
      console.warn('Reconnecting...', err)
    );

    this.hubConnection.onreconnected(id =>
      console.log('Reconnected, connectionId:', id)
    );

    this.hubConnection.onclose(err =>
      console.error('SignalR closed', err)
    );
  }

  /* ================================
     HUB EVENTS
  ================================= */
  private registerHubEvents(): void {

    this.hubConnection.on('ReceiveCompleted', data => {
      this.receiveCompleted$.next(data);
    });

    this.hubConnection.on('ReceiveCheckIn', data => {
      this.receiveCheckIn$.next(data);
    });

    this.hubConnection.on('AppointmentBooked', data => {
      this.appointmentBooked$.next(data);
    });
  }

  /* ================================
     OBSERVABLES (PUBLIC)
  ================================= */
  onReceiveCompleted(): Observable<any> {
    return this.receiveCompleted$.asObservable();
  }

  onReceiveCheckIn(): Observable<any> {
    return this.receiveCheckIn$.asObservable();
  }

  onAppointmentBooked(): Observable<any> {
    return this.appointmentBooked$.asObservable();
  }

  /* ================================
     DISCONNECT
  ================================= */
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      console.log('SignalR disconnected');
    }
  }
}
