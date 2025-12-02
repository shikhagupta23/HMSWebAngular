import { Component, inject, OnInit } from '@angular/core';
import { Appointment } from '../services/appointment';
import { ToastService } from '../../../../../shared/services/toast-service';

@Component({
  selector: 'app-view-todays-appointments',
  standalone: false,
  templateUrl: './view-todays-appointments.html',
  styleUrl: './view-todays-appointments.scss',
})
export class ViewTodaysAppointments implements OnInit {

  private appointmentService = inject(Appointment);
  private toast = inject(ToastService);

  masterData: any[] = [];
  filteredData: any[] = [];
  dataList: any[] = [];
  searchText: string = "";

  pageNumber = 1;
  pageSize = 3;
  totalCount = 0;
  totalPages = 0;

  activeTab: string = "All";

  ngOnInit(): void {
    this.loadFullData();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }


loadFullData() {
  const today = this.getTodayDate();

  this.appointmentService
    .getAppointments(this.pageNumber, this.pageSize, 0, today, this.searchText)
    .subscribe({
      next: (res: any) => {
        console.log("API Response:", res);
        console.log(this.searchText);
        // 🔥 VERY IMPORTANT
        this.masterData = res.dataList;   // API DATA
        this.filteredData = [...this.masterData];

        this.totalCount = res.totalCount ?? this.filteredData.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);

        this.paginate(); // finally paginate
      },
      error: () => this.toast.error("Something went wrong"),
    });
}


onSearchChange() {
    this.pageNumber = 1;

  this.loadFullData();
}

  applyFilter(tab: string) {
    this.activeTab = tab;
    this.pageNumber = 1;

    switch (tab) {
      case "Scheduled":
        this.filteredData = this.masterData.filter(x => x.status === 0);
        break;

      case "Ongoing":
        this.filteredData = this.masterData.filter(x => x.status === 1);
        break;

      case "Completed":
        this.filteredData = this.masterData.filter(x => x.status === 2);
        break;

      case "Cancelled":
        this.filteredData = this.masterData.filter(x => x.status === 4);
        break;

      default:
        // 🔥 "All" tab – DO NOT check status
        this.filteredData = this.masterData;
        break;
    }

    // Search filter
    if (this.searchText.trim() !== "") {
      const s = this.searchText.toLowerCase();
      this.filteredData = this.filteredData.filter(x =>
        x.patientName.toLowerCase().includes(s) ||
        x.doctorName.toLowerCase().includes(s) ||
        x.patientPhone.includes(s) ||
        x.visitReason.toLowerCase().includes(s)
      );
    }

    this.totalCount = this.filteredData.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    this.paginate();
  }



  paginate() {
    const start = (this.pageNumber - 1) * this.pageSize;
    this.dataList = this.filteredData.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.paginate();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.paginate();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.paginate();
    }
  }

  formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  get scheduledCount() {
    return this.masterData.filter(x => x.status === 0).length;
  }

  get ongoingCount() {
    return this.masterData.filter(x => x.status === 1).length;
  }

  get completedCount() {
    return this.masterData.filter(x => x.status === 2).length;
  }

  get cancelledCount() {
    return this.masterData.filter(x => x.status === 4).length;
  }
}
