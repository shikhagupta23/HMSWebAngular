import { Component, inject, OnInit} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DashboardService } from './Service/dashboard-service';
import { error } from 'console';

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
  pendingAppointments: number = 0;
  completedAppointments: number = 0;
  cancelledAppointments: number = 0;
  revenue: number = 0;
  todayAppointments: number = 0;
  totalPatients: number = 0;
  totalTodayPatients: number = 0;
  todayRevenue: number = 0;
  todayCompletedAppointments: number = 0;
  todayPendingAppointments: number = 0;
  todayCancelledAppointments: number = 0;
  todayScheduledAppointments: number = 0;
  totalScheduledAppointments: number = 0;
  activeTab: 'today' | 'overall' = 'today';
  isToday: boolean = true;
  
  todaySummary!: DashboardSummary;
  overallSummary!: DashboardSummary;
  
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  constructor() {}

  ngOnInit(): void {
    this.today = this.getTodayDate();
    this.loadDashboardData();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url.includes('dashboard')) {
      }
    });
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadDashboardData(){
    this.dashboardService.getDahBoardData().subscribe({
      next: (res) => {
        let dashboardData = res.data;
        let totalAllAppointment = dashboardData.pendingAllAppointments + dashboardData.completedAllAppointments + dashboardData.cancelledAllAppointments + dashboardData.scheduledAllAppointments;

        this.todayAppointments = dashboardData.totalAppointments;
        this.todayPendingAppointments = dashboardData.pendingAppointments;
        this.todayCompletedAppointments = dashboardData.completedAppointments;
        this.todayCancelledAppointments = dashboardData.cancelledAppointments;
        this.todayRevenue = dashboardData.todayRevenue;
        this.totalTodayPatients = dashboardData.totalTodayPatient;
        this.todayScheduledAppointments = dashboardData.scheduledAppointments;

        this.totalAppointments = totalAllAppointment;
        this.pendingAppointments = dashboardData.pendingAllAppointments;
        this.completedAppointments = dashboardData.completedAllAppointments;
        this.cancelledAppointments = dashboardData.cancelledAllAppointments;
        this.revenue = dashboardData.totalRevenue;
        this.totalPatients = dashboardData.totalAllPatient;
        this.totalScheduledAppointments = dashboardData.scheduledAllAppointments;
      },
      error: (err) => {
        console.error("Error loading dashboard data", err);
      }
    });

    this.dashboardService.getDashboardRecords(this.isToday).subscribe({
      next:(res) => {
        console.log(res);
      },
      error: (err) => {
        console.error("Error loading dashboard record", err);
      }
    })
  }




}
