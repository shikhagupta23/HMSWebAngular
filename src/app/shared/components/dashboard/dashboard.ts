import { Component, inject, OnInit} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DashboardService } from './Service/dashboard-service';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { FeatureAccessKeys } from '../../constants/feature-access-keys';

interface DashboardSummary {
  appointments: number;
  scheduled: number;
  completed: number;
  pending: number;
  cancelled: number;
  patients: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit{

  masterData: any[] = [];
  filteredData: any[] = [];
  today: string = '';
  totalAppointments: number = 0;
  scheduledAppointments: number = 0;
  pendingAppointments: number = 0;
  completedAppointments: number = 0;
  cancelledAppointments: number = 0;
  totalPatients: number = 0;
  totalRevenue: number = 0;
  activeTab: 'today' | 'overall' = 'today';
  IsToday: boolean = true;
  
  todaySummary!: DashboardSummary;
  overallSummary!: DashboardSummary;
  
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  // Dashboard card shortcut routes
  dashboardShortcuts = {
    todayAppointments: '/appointment/todayappointments',
    allAppointments: '/appointment/allappointments',
    scheduledAppointments: '/appointment/allappointments',
    completedAppointments: '/appointment/allappointments',
    cancelledAppointments: '/appointment/allappointments',
    patients: '/patient/allpatient',
    revenue: '/invoice'
  };

  constructor() {}

  dashboardCards = [
    {
      title: 'Appointments',
      value: () => this.totalAppointments,
      icon: 'fa-calendar-day',
      click: () => this.navigateByCard('appointments'),
      featureKey: FeatureAccessKeys.Appointments
    },
    {
      title: 'Scheduled Appointments',
      value: () => this.scheduledAppointments,
      icon: 'fa-calendar-plus',
      click: () => this.navigateByCard('scheduled'),
      featureKey: FeatureAccessKeys.ScheduledAppointments
    },
    {
      title: 'Completed Appointments',
      value: () => this.completedAppointments,
      icon: 'fa-circle-check',
      click: () => this.navigateByCard('completed'),
      featureKey: FeatureAccessKeys.CompletedAppointments
    },
    {
      title: 'Ongoing Appointments',
      value: () => this.pendingAppointments,
      icon: 'fa-clock',
      click: () => this.navigateByCard('ongoing'),
      featureKey: FeatureAccessKeys.OngoingAppointments
    },
    {
      title: 'Cancelled Appointments',
      value: () => this.cancelledAppointments,
      icon: 'fa-calendar-xmark',
      click: () => this.navigateByCard('cancelled'),
      featureKey: FeatureAccessKeys.CancelledAppointments
    },
    {
      title: 'Patients',
      value: () => this.totalPatients,
      icon: 'fa-user-plus',
      click: () => this.navigateByCard('patients'),
      featureKey: FeatureAccessKeys.Patients
    },
    {
      title: 'Revenue',
      value: () => this.totalRevenue,
      icon: 'fa-chart-line',
      featureKey: FeatureAccessKeys.Revenue
    }
  ];

  ngOnInit(): void {
    this.today = this.getTodayDate();
    this.loadDashboardData(true);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url.includes('dashboard')) {
        // this.loadFullData();
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
  }

  loadDashboardData(isToday: boolean) {

    this.dashboardService.getDahBoardData(isToday).subscribe({
      next: (res) => {
        let dashboardData = res;
        console.log(dashboardData);
        this.totalAppointments = dashboardData.totalAppointments;
        this.scheduledAppointments = dashboardData.scheduledAppointments;
        this.pendingAppointments = dashboardData.ongoingAppointments;
        this.completedAppointments = dashboardData.completedAppointments;
        this.cancelledAppointments = dashboardData.cancelledAppointments;
        this.totalPatients = dashboardData.totalPatients;
        this.totalRevenue = dashboardData.totalRevenue;
      },
      error: (err) => {
        console.error("Error loading dashboard data", err);
      }
    });
  }

  navigateByCard(cardType: 'appointments' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'patients') {

    if (cardType === 'patients') {
      this.router.navigate(['/patient/allpatient']);
      return;
    }

    const statusMap = {
      appointments: 3,
      scheduled: 0,
      ongoing: 1,
      completed: 2,
      cancelled: 4
    };

    const route =
      this.activeTab === 'today'
        ? '/appointment/todayappointments'
        : '/appointment/allappointments';

    this.router.navigate(
      [route],
      { queryParams: { status: statusMap[cardType] } }
    );
  }
  
}
