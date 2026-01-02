import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../shared/services/api-service';
import { ApiEndpoints } from '../../../../shared/constants/api-endpoints';
import { AuthService } from '../../../auth/services/auth-service';
import { DashboardService } from '../../../../shared/components/dashboard/Service/dashboard-service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);

  role: string | null = null;
  isAdmin = false;
  isSuperAdmin = false;

  activeTab: 'today' | 'overall' = 'today';

  totalHospitals = 0;
  totalAppointments = 0;
  scheduledAppointments = 0;
  ongoingAppointments = 0;
  completedAppointments = 0;
  cancelledAppointments = 0;
  totalRevenue = 0;
  totalDoctors = 0;
  totalReceptionists = 0;
  totalPatients = 0;
  totalFollowUpCount = 0;

  ngOnInit(): void {
    try {
      this.role = this.auth.getUserRole();
    } catch {
      this.role = null;
    }

    const r = (this.role || '').toLowerCase();
    this.isAdmin = r === 'admin';
    this.isSuperAdmin = r === 'superadmin';

    // 🔥 initial load → Today
    this.loadDashboardData(true);
  }

  /* ==============================
     TAB CHANGE HANDLER
  ============================== */
  changeTab(tab: 'today' | 'overall') {
    this.activeTab = tab;

    const isToday = tab === 'today';
    this.loadDashboardData(isToday);
  }

  /* ==============================
     DASHBOARD API CALL
  ============================== */
  loadDashboardData(isToday: boolean) {
    this.dashboardService.getDashboardSummary(isToday).subscribe({
      next: (res) => {

        const d = res || {};

        this.totalHospitals = d.totalHospitals || 0;
        this.totalAppointments = d.totalAppointments || 0;
        this.scheduledAppointments = d.scheduledAppointments || 0;
        this.ongoingAppointments = d.ongoingAppointments || 0;
        this.completedAppointments = d.completedAppointments || 0;
        this.cancelledAppointments = d.cancelledAppointments || 0;
        this.totalRevenue = d.totalRevenue || 0;
        this.totalDoctors = d.totalDoctors || 0;
        this.totalReceptionists = d.totalReceptionists || 0;
        this.totalPatients = d.totalPatients || 0;
        this.totalFollowUpCount = d.totalFollowUpCount || 0;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
      }
    });
  }
}

