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
  private userAdded$ = new Subject<any>();
  private hospitalAdded$ = new Subject<any>();
  private featureAdded$ = new Subject<any>();
  private featureAssigned$ = new Subject<any>();
  private packageAdded$ = new Subject<any>();
  private packageAssigned$ = new Subject<any>();


  // 🔗 Hub URL
  private readonly hubUrl =
    'https://api-clinicmanagement.rsdemoprojects.in/patientHub';
    // 'https://localhost:7220/patientHub';

  constructor() {}

  /* ================================
     JWT → ROLE EXTRACTION
  ================================= */
  private getRoleFromToken(): string | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  } catch (err) {
    console.error('Invalid JWT token', err);
    return null;
  }
}

private getHospitalIdFromToken(): string | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['HospitalId'] || null; // must match backend claim name
  } catch (err) {
    console.error('Invalid JWT token', err);
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
    const hospitalId = this.getHospitalIdFromToken();

    if (!role) {
      console.warn('Role not found, SignalR not connected');
      return;
    }
    
    let hubUrlWithParams  = `${this.hubUrl}?role=${encodeURIComponent(role)}`;
      // ✅ Attach hospitalId only for non-superadmin users
      if (role !== 'SuperAdmin' && hospitalId) {
        hubUrlWithParams += `&hospitalId=${encodeURIComponent(hospitalId)}`;
      }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrlWithParams , {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
        withCredentials: false
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 🔔 Register server events
    this.registerHubEvents();

    try {
      console.log('Connecting to SignalR:', hubUrlWithParams);
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
      console.log('AppointmentBooked received' );
      this.appointmentBooked$.next(data);
    });

    this.hubConnection.on('UserCreated', data => {
      this.userAdded$.next(data);
    });

    this.hubConnection.on('HospitalCreated', data => {
      this.hospitalAdded$.next(data);
    });

    this.hubConnection.on('FeatureCreated', data => {
      this.featureAdded$.next(data);
    });

    this.hubConnection.on('AssignedFeature', data => {
      this.featureAssigned$.next(data);
    });

    this.hubConnection.on('PackageCreated', data => {
      this.packageAdded$.next(data);
    });

    this.hubConnection.on('PackageAssigned', data => {
      this.packageAssigned$.next(data);
    });
  }

  
  onReceiveCompleted(): Observable<any> {
    return this.receiveCompleted$.asObservable();
  }

  onReceiveCheckIn(): Observable<any> {
    return this.receiveCheckIn$.asObservable();
  }

  onAppointmentBooked(): Observable<any> {
    return this.appointmentBooked$.asObservable();
  }

  onUserAdd(): Observable<any> {
    return this.userAdded$.asObservable();
  }

  onHospitalAdded(): Observable<any> {
    return this.hospitalAdded$.asObservable();
  }

  onFeatureAdded(): Observable<any> {
    return this.featureAdded$.asObservable();
  }

  onFeatureAssigned(): Observable<any> {
    return this.featureAssigned$.asObservable();
  }

  onPackageCreated(): Observable<any> {
    return this.packageAdded$.asObservable();
  }

  onPackageAssigned(): Observable<any> {
    return this.packageAssigned$.asObservable();
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
