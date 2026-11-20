import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DashboardService } from './Service/dashboard-service';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { FeatureAccessKeys } from '../../constants/feature-access-keys';
import { Appointment } from '../../../modules/doctor/modules/appointment/services/appointment';
import { PatientService } from '../../../modules/doctor/modules/patient/services/patient-service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  totalAppointments = 0;
  scheduledAppointments = 0;
  pendingAppointments = 0;
  completedAppointments = 0;
  cancelledAppointments = 0;
  totalPatients = 0;
  totalRevenue = 0;
  activeTab: 'today' | 'overall' = 'today';
  IsToday = true;

  todayAppointments: any[] = [];
  appointmentTab: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all';
  recentPatients: any[] = [];

  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private appointmentService = inject(Appointment);
  private patientService = inject(PatientService);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  kpis = [
    {
      title: "Today's Appointments",
      value: () => this.totalAppointments,
      icon: 'fa-calendar-day',
      tone: 'blue',
      featureKey: FeatureAccessKeys.Appointments,
      click: () => this.navigateByCard('appointments'),
      isRevenue: false,
    },
    {
      title: 'Completed',
      value: () => this.completedAppointments,
      icon: 'fa-circle-check',
      tone: 'green',
      featureKey: FeatureAccessKeys.CompletedAppointments,
      click: () => this.navigateByCard('completed'),
      isRevenue: false,
    },
    {
      title: 'Upcoming',
      value: () => this.upcomingKpiCount,
      icon: 'fa-clock',
      tone: 'purple',
      featureKey: FeatureAccessKeys.ScheduledAppointments,
      click: () => this.navigateByCard('scheduled'),
      isRevenue: false,
    },
    {
      title: 'Patients',
      value: () => this.patientsKpiCount,
      icon: 'fa-user-injured',
      tone: 'orange',
      featureKey: FeatureAccessKeys.Patients,
      click: () => this.navigateByCard('patients'),
      isRevenue: false,
    },
    {
      title: "Today's Revenue",
      value: () => this.totalRevenue,
      icon: 'fa-indian-rupee-sign',
      tone: 'teal',
      featureKey: FeatureAccessKeys.Revenue,
      click: undefined as (() => void) | undefined,
      isRevenue: true,
    },
  ];

  /** Prefer live today's list for Upcoming; else API scheduled + ongoing. */
  get upcomingKpiCount(): number {
    if (this.activeTab === 'today' && this.todayAppointments?.length) {
      return this.upcomingCount;
    }
    const fromApi = Number(this.scheduledAppointments) || 0;
    const ongoing = Number(this.pendingAppointments) || 0;
    if (fromApi > 0 || ongoing > 0) return fromApi + ongoing;
    return this.upcomingCount;
  }

  get patientsKpiCount(): number {
    const fromApi = Number(this.totalPatients) || 0;
    if (fromApi > 0) return fromApi;
    return this.recentPatients?.length || 0;
  }

  ngOnInit(): void {
    this.loadDashboardData(true);
    this.loadTodayAppointments();
    this.loadRecentPatients();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && event.url.includes('dashboard')) {
        // refresh handled by user navigation
      }
    });
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onTabChange(tab: 'today' | 'overall'): void {
    this.activeTab = tab;
    this.IsToday = tab === 'today';
    this.loadDashboardData(this.IsToday);
    if (tab === 'today') {
      this.loadTodayAppointments();
    }
  }

  /** Show KPI when feature granted, or when user has no featureList (legacy). */
  canShowKpi(featureKey: string): boolean {
    const list = this.authService.getUser()?.featureList;
    if (!list?.length) return true;
    if (this.authService.hasFeature(featureKey)) return true;

    // Dashboard aliases: scheduled/completed/ongoing/cancelled inherit Appointments
    const appointmentChildren: string[] = [
      FeatureAccessKeys.ScheduledAppointments,
      FeatureAccessKeys.CompletedAppointments,
      FeatureAccessKeys.OngoingAppointments,
      FeatureAccessKeys.CancelledAppointments,
    ];
    if (
      appointmentChildren.includes(featureKey) &&
      this.authService.hasFeature(FeatureAccessKeys.Appointments)
    ) {
      return true;
    }

    // Patients card: show if user can open patients menu (same key) OR has appointments access
    if (
      featureKey === FeatureAccessKeys.Patients &&
      this.authService.hasFeature(FeatureAccessKeys.Appointments)
    ) {
      return true;
    }

    return false;
  }

  private pickNumber(source: any, ...keys: string[]): number | null {
    if (!source) return null;
    for (const key of keys) {
      const val = source[key];
      if (val === null || val === undefined || val === '') continue;
      const n = Number(val);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  }

  private unwrapDashboardPayload(res: any): any {
    if (!res || typeof res !== 'object') return {};
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      return { ...res, ...res.data };
    }
    return res;
  }

  loadDashboardData(isToday: boolean) {
    this.dashboardService.getDashboardSummary(isToday).subscribe({
      next: (res) => {
        const d = this.unwrapDashboardPayload(res);
        const totalAppt = this.pickNumber(
          d,
          'totalAppointments',
          'TotalAppointments',
          'appointmentCount'
        );
        const scheduled = this.pickNumber(
          d,
          'scheduledAppointments',
          'ScheduledAppointments',
          'upcomingAppointments',
          'UpcomingAppointments',
          'upcomingCount'
        );
        const ongoing = this.pickNumber(
          d,
          'ongoingAppointments',
          'OngoingAppointments',
          'pendingAppointments'
        );
        const completed = this.pickNumber(d, 'completedAppointments', 'CompletedAppointments');
        const cancelled = this.pickNumber(d, 'cancelledAppointments', 'CancelledAppointments');
        const patients = this.pickNumber(
          d,
          'totalPatients',
          'TotalPatients',
          'patientCount',
          'PatientCount'
        );
        const revenue = this.pickNumber(d, 'totalRevenue', 'TotalRevenue', 'revenue');

        if (totalAppt !== null) this.totalAppointments = totalAppt;
        if (scheduled !== null) this.scheduledAppointments = scheduled;
        if (ongoing !== null) this.pendingAppointments = ongoing;
        if (completed !== null) this.completedAppointments = completed;
        if (cancelled !== null) this.cancelledAppointments = cancelled;
        if (patients !== null) this.totalPatients = patients;
        if (revenue !== null) this.totalRevenue = revenue;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
      },
    });
  }

  loadTodayAppointments(): void {
    const today = this.getTodayDate();
    this.appointmentService.getAllPatientAsPerDoctor(1, 100, '', 3, today).subscribe({
      next: (res: any) => {
        this.todayAppointments = res?.dataList ?? [];
        // Keep summary fields in sync for Today view when API omits them
        if (this.scheduledAppointments === 0) {
          this.scheduledAppointments = this.todayAppointments.filter(
            (x) => Number(x.appointmentStatus) === 0
          ).length;
        }
        if (this.pendingAppointments === 0) {
          this.pendingAppointments = this.todayAppointments.filter(
            (x) => Number(x.appointmentStatus) === 1
          ).length;
        }
        if (this.totalAppointments === 0 && this.todayAppointments.length) {
          this.totalAppointments = this.todayAppointments.length;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.todayAppointments = [];
        this.cdr.markForCheck();
      },
    });
  }

  loadRecentPatients(): void {
    this.patientService.getPatients(1, 100, '').subscribe({
      next: (res: any) => {
        const list = res?.dataList ?? res?.data ?? [];
        this.recentPatients = Array.isArray(list) ? list.slice(0, 8) : [];
        if (!this.totalPatients) {
          this.totalPatients =
            this.pickNumber(res, 'totalCount', 'TotalCount', 'totalRecords', 'count') ??
            (Array.isArray(list) ? list.length : 0);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.recentPatients = [];
        this.cdr.markForCheck();
      },
    });
  }

  get filteredTodayAppointments(): any[] {
    const list = this.todayAppointments;
    switch (this.appointmentTab) {
      case 'upcoming':
        return list.filter((x) => x.appointmentStatus === 0 || x.appointmentStatus === 1);
      case 'completed':
        return list.filter((x) => x.appointmentStatus === 2);
      case 'cancelled':
        return list.filter((x) => x.appointmentStatus === 4);
      default:
        return list;
    }
  }

  get upcomingCount(): number {
    return this.todayAppointments.filter(
      (x) => x.appointmentStatus === 0 || x.appointmentStatus === 1
    ).length;
  }

  get completedCount(): number {
    return this.todayAppointments.filter((x) => x.appointmentStatus === 2).length;
  }

  get cancelledCount(): number {
    return this.todayAppointments.filter((x) => x.appointmentStatus === 4).length;
  }

  statusLabel(status: number): string {
    if (status === 2) return 'Completed';
    if (status === 4) return 'Cancelled';
    if (status === 1) return 'Ongoing';
    return 'Upcoming';
  }

  statusBadgeClass(status: number): string {
    if (status === 2) return 'mp-badge mp-badge--success';
    if (status === 4) return 'mp-badge mp-badge--danger';
    if (status === 1) return 'mp-badge mp-badge--warn';
    return 'mp-badge mp-badge--info';
  }

  appointmentTimeLabel(a: any): string {
    const raw = a?.appointmentDate || a?.createdAt;
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  navigateByCard(
    cardType: 'appointments' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'patients'
  ) {
    if (cardType === 'patients') {
      this.router.navigate(['/patient/allpatient']);
      return;
    }

    const statusMap = {
      appointments: 3,
      scheduled: 0,
      ongoing: 1,
      completed: 2,
      cancelled: 4,
    };

    const route =
      this.activeTab === 'today'
        ? '/appointment/todayappointments'
        : '/appointment/allappointments';

    this.router.navigate([route], { queryParams: { status: statusMap[cardType] } });
  }
}
