import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../shared/constants/api-endpoints';
import { AuthService } from '../../../auth/services/auth-service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  private api = inject(ApiService);
  private auth = inject(AuthService);

  role: string | null = null;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;
  hospitalCount: number = 0;
  hospitalList: any[] = [];

  doctorsCount: number = 0;
  patientsCount: number = 0;
  appointmentsCount: number = 0;
  revenueTotal: number = 0;
  scheduledAppointments: number = 0;
  pendingAppointments: number = 0;
  completedAppointments: number = 0;
  cancelledAppointments: number = 0;
  totalFollowUpToday: number = 0;

  doctorList: any[] = [];
  patientList: any[] = [];
  appointmentList: any[] = [];

  ngOnInit(): void {
    try {
      this.role = this.auth.getUserRole();
    } catch (e) {
      this.role = null;
    }
    const r = (this.role || '').toLowerCase();
    this.isAdmin = r === 'admin';
    this.isSuperAdmin = r === 'superadmin';

    if (this.isSuperAdmin) {
      this.loadSuperadminData();
    } else {
      this.loadDashboardData();
    }
  }

  private loadSuperadminData() {
    const hospitals$ = this.api.get<any>(ApiEndpoints.HOSPITAL.GET(1, 10, ''));
    hospitals$.subscribe({
      next: res => {
        const list = this.extractList(res?.dataList ?? res?.data ?? res);
        this.hospitalList = list;
        this.hospitalCount = this.extractCount(res, list.length);
      },
      error: err => {
        console.error('Hospital API error', err);
      }
    });
  }

  private loadDashboardData() {
    const doctors$ = this.api.get<any>(ApiEndpoints.DOCTOR.GET, { page: 1, pageSize: 5 });
    const patients$ = this.api.get<any>(ApiEndpoints.PATIENT.GET(1, 5, ''));
    const appointments$ = this.api.get<any>(ApiEndpoints.APPOINTMENT.GET, { page: 1, pageSize: 5 });
    const todayAppointments$ = this.api.get<any>(ApiEndpoints.DASHBOARD.GETDASHBOARDDATA);

    forkJoin({ doctors: doctors$, patients: patients$, appointments: appointments$, today: todayAppointments$ }).subscribe({
      next: res => {
        this.doctorList = this.extractList(res.doctors?.dataList ?? res.doctors);
        this.patientList = this.extractList(res.patients?.dataList ?? res.patients);
        this.appointmentList = this.extractList(res.appointments?.dataList ?? res.appointments);

        // Prefer summary from dashboard API when available
        const summary = res.today && (res.today.data ?? res.today);
        if (summary) {
          this.appointmentsCount = Number(summary.totalAppointments ?? this.appointmentsCount) || 0;
          this.scheduledAppointments = Number(summary.scheduledAppointments ?? 0) || 0;
          this.pendingAppointments = Number(summary.pendingAppointments ?? 0) || 0;
          this.completedAppointments = Number(summary.completedAppointments ?? 0) || 0;
          this.cancelledAppointments = Number(summary.cancelledAppointments ?? 0) || 0;
          this.revenueTotal = Number(summary.totalRevenue ?? this.revenueTotal) || 0;
          this.doctorsCount = Number(summary.totalDoctors ?? this.doctorsCount) || 0;
          this.patientsCount = Number(summary.totalPatients ?? this.patientsCount) || 0;
          this.totalFollowUpToday = Number(summary.totalFollowUpToday ?? 0) || 0;
        } else {
          // fallback to counting lists
          this.doctorsCount = this.extractCount(res.doctors?.dataList ?? res.doctors, this.doctorList.length);
          this.patientsCount = this.extractCount(res.patients?.dataList ?? res.patients, this.patientList.length);
          this.appointmentsCount = this.extractCount(res.appointments?.dataList ?? res.appointments, this.appointmentList.length);

          const revenueFromAppointments = (this.appointmentList || []).reduce((acc, a) => acc + (Number(a?.amount) || Number(a?.paid) || 0), 0);
          this.revenueTotal = revenueFromAppointments;
        }
      },
      error: err => {
        console.error('Dashboard API error', err);
      }
    });
  }

  private extractList(resp: any): any[] {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.result)) return resp.result;
    if (Array.isArray(resp.items)) return resp.items;
    return [];
  }

  private extractCount(resp: any, fallback = 0): number {
    if (!resp) return fallback;
    if (typeof resp.totalCount === 'number') return resp.totalCount;
    if (typeof resp.count === 'number') return resp.count;
    if (typeof resp.total === 'number') return resp.total;
    if (Array.isArray(resp)) return resp.length;
    return fallback;
  }

}
