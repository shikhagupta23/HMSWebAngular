import { Component, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth-service';
import { DashboardService } from '../../../../shared/components/dashboard/Service/dashboard-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

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
  pendingAppointments=0;
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

  //InActive User properties
  inactiveUsers: any[] = [];
  inactiveUserCount = 0;
  paginatedUsers: any[] = [];

  // Doctors list properties
doctorsList: any[] = [];
doctorsCurrentPage = 1;
doctorsItemsPerPage = 5;
paginatedDoctors: any[] = [];


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
    this.loadInActiveUserData()
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

        this.doctorsList = d.doctors || [];
        this.doctorsCurrentPage = 1;
        this.updatePaginatedDoctors();

        
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
   Handles multiple formats safely
============================== */
parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof dateValue === 'string') {
    const dateString = dateValue.trim();
    if (!dateString) return null;

    try {
      // ✅ Handle: MM/DD/YYYY hh:mm:ss AM/PM
      if (dateString.includes('/') && dateString.toUpperCase().includes('AM') || dateString.toUpperCase().includes('PM')) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      }

      // Existing logic (DD-MM-YYYY HH:mm:ss)
      if (dateString.includes(' ')) {
        const [datePart, timePart] = dateString.split(' ');
        const dateParts = datePart.split('-');
        const timeParts = timePart?.split(':') || ['0', '0', '0'];

        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const year = parseInt(dateParts[2], 10);

          const hour = parseInt(timeParts[0], 10);
          const minute = parseInt(timeParts[1], 10);
          const second = parseInt(timeParts[2], 10);

          const date = new Date(year, month, day, hour, minute, second);
          return isNaN(date.getTime()) ? null : date;
        }
      }

      // DD-MM-YYYY or DD/MM/YYYY
      if (dateString.includes('-') || dateString.includes('/')) {
        const separator = dateString.includes('-') ? '-' : '/';
        const parts = dateString.split(separator);

        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);

          const date = new Date(year, month, day);
          return isNaN(date.getTime()) ? null : date;
        }
      }

      // Fallback
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;

    } catch {
      return null;
    }
  }

  return null;
}

 /* ==============================
     Dashboard Package API CALL
  ============================== */
  loadInActiveUserData() {
  this.dashboardService.getInActiveUser().subscribe({
    next: (res: any[]) => {
      this.inactiveUsers = res || [];
      this.inactiveUserCount = this.inactiveUsers.length;

      // Reset to first page and update display
      this.currentPage = 1;
      this.updatePaginatedUsers();

      console.log('Inactive users loaded:', this.inactiveUserCount);
    },
    error: (err) => {
      console.error('Error loading inactive users', err);
      this.inactiveUsers = [];
      this.inactiveUserCount = 0;
      this.paginatedUsers = [];
    }
  });
}
/* ==============================
   PAGINATION FOR INACTIVE USERS
============================== */

// Items per page for inactive users
inactiveItemsPerPage = 5;
inactiveCurrentPage = 1;

// Calculate total pages for inactive users
get inactiveTotalPages(): number {
  return Math.ceil(this.inactiveUserCount / this.inactiveItemsPerPage);
}

// Get array of page numbers for inactive users
get inactivePageNumbers(): number[] {
  return Array.from({ length: this.inactiveTotalPages }, (_, i) => i + 1);
}

// Update paginated inactive users based on current page
updatePaginatedUsers() {
  const startIndex = (this.inactiveCurrentPage - 1) * this.inactiveItemsPerPage;
  const endIndex = startIndex + this.inactiveItemsPerPage;
  this.paginatedUsers = this.inactiveUsers.slice(startIndex, endIndex);
}

// Go to specific page for inactive users
goToInactivePage(page: number) {
  if (page >= 1 && page <= this.inactiveTotalPages) {
    this.inactiveCurrentPage = page;
    this.updatePaginatedUsers();
  }
}

// Go to next page for inactive users
nextInactivePage() {
  if (this.inactiveCurrentPage < this.inactiveTotalPages) {
    this.inactiveCurrentPage++;
    this.updatePaginatedUsers();
  }
}

// Go to previous page for inactive users
previousInactivePage() {
  if (this.inactiveCurrentPage > 1) {
    this.inactiveCurrentPage--;
    this.updatePaginatedUsers();
  }
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

  //Doctor Pagination Methods
   
  // Calculate total pages for doctors
get doctorsTotalPages(): number {
  return Math.ceil(this.doctorsList.length / this.doctorsItemsPerPage);
}

// Get array of page numbers for doctors
get doctorsPageNumbers(): number[] {
  return Array.from({ length: this.doctorsTotalPages }, (_, i) => i + 1);
}

// Update paginated doctors based on current page
updatePaginatedDoctors() {
  const startIndex = (this.doctorsCurrentPage - 1) * this.doctorsItemsPerPage;
  const endIndex = startIndex + this.doctorsItemsPerPage;
  this.paginatedDoctors = this.doctorsList.slice(startIndex, endIndex);
}

// Go to specific page for doctors
goToDoctorsPage(page: number) {
  if (page >= 1 && page <= this.doctorsTotalPages) {
    this.doctorsCurrentPage = page;
    this.updatePaginatedDoctors();
  }
}

// Go to next page for doctors
nextDoctorsPage() {
  if (this.doctorsCurrentPage < this.doctorsTotalPages) {
    this.doctorsCurrentPage++;
    this.updatePaginatedDoctors();
  }
}

// Go to previous page for doctors
previousDoctorsPage() {
  if (this.doctorsCurrentPage > 1) {
    this.doctorsCurrentPage--;
    this.updatePaginatedDoctors();
  }
}

}

