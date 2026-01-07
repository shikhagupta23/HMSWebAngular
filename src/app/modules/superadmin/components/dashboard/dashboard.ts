import { Component, inject } from '@angular/core';
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
  totalPackagesCount = 0;

    // Package pagination properties
  packages: any[] = [];
  packageCount = 0;
  currentPage = 1;
  itemsPerPage = 5;
  paginatedPackages: any[] = [];

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
    this.loadActivePakageData();
  }

  /* ==============================
     TAB CHANGE HANDLER
  ============================== */
  changeTab(tab: 'today' | 'overall') {
    this.activeTab = tab;
    this.loadActivePakageData();
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

  /* ==============================
     Dashboard Package API CALL
  ============================== */
  loadActivePakageData() {
    this.dashboardService.getActivePackages().subscribe({
      next: (res) => {
        this.packages = res || [];
        this.packageCount = this.packages.length;
        
        // Reset to first page and update display
        this.currentPage = 1;
        this.updatePaginatedPackages();
        
        console.log('Packages loaded:', this.packageCount);
      },
      error: (err) => {
        console.error('Error loading packages', err);
        this.packages = [];
        this.packageCount = 0;
        this.paginatedPackages = [];
      }
    });
  }

  /* ==============================
     PAGINATION METHODS
  ============================== */
  
  // Calculate total number of pages
  get totalPages(): number {
    return Math.ceil(this.packageCount / this.itemsPerPage);
  }

  // Get array of page numbers for buttons
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Update which packages to display based on current page
  updatePaginatedPackages() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPackages = this.packages.slice(startIndex, endIndex);
  }

  // Go to specific page
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedPackages();
    }
  }

  // Go to next page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedPackages();
    }
  }

  // Go to previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPackages();
    }
  }

  /* ==============================
   HELPER METHOD - Convert date string to Date object
============================== */
parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Format: "29-12-2025 12:13:47" (DD-MM-YYYY HH:mm:ss)
  const parts = dateString.split(' ');
  const dateParts = parts[0].split('-');
  const timeParts = parts[1]?.split(':') || ['00', '00', '00'];
  
  const date = new Date(
    parseInt(dateParts[2]), 
    parseInt(dateParts[1]) - 1, 
    parseInt(dateParts[0]),
    parseInt(timeParts[0]), 
    parseInt(timeParts[1]), 
    parseInt(timeParts[2])  
  );
  
  return date;
}

}

