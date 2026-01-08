import { Component, inject, OnInit} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DashboardService } from './Service/dashboard-service';

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

  navigateByCard(cardType: 
    'appointments' | 
    'scheduled' | 
    'ongoing' | 
    'completed' | 
    'cancelled'
  ) {

    if (this.activeTab === 'today') {
      this.router.navigate(['/appointment/todayappointments']);
      return;
    }

    const statusMap: any = {
      appointments: 3,
      scheduled: 0,
      ongoing: 1,
      completed: 2,
      cancelled: 4
    };

    this.router.navigate(
      ['/appointment/allappointments'],
      { queryParams: { status: statusMap[cardType] } }
    );
  }



}
