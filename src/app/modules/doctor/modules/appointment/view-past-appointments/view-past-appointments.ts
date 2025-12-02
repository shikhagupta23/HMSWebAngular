import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-past-appointments',
  standalone: false,
  templateUrl: './view-past-appointments.html',
  styleUrl: './view-past-appointments.scss',
})
export class ViewPastAppointments implements OnInit {

  masterData: any[] = [];
  dataList: any[] = [];
  filteredData: any[] = [];
  searchText: string = " ";

  pageNumber = 1;
  pageSize = 5;
  totalCount = 0;
  totalPages = 0;

  activeTab: string = "All";   

  ngOnInit(): void {
    this.loadFullData();
    this.applyFilter("All");
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadFullData() {
    const defaultData  = [
      { appointmentViewId: 201, patientName: "Ravi Kumar", appointmentDate: "2025-11-20", visitReason: "Fever", patientPhone: "9876543210", doctorName: "Dr. Sharma", createdDate: "2025-11-19", status: "Pending" },
      { appointmentViewId: 202, patientName: "Neha Sharma", appointmentDate: "2025-11-19", visitReason: "Headache", patientPhone: "9988776655", doctorName: "Dr. Sharma", createdDate: "2025-11-18", status: "Completed" },
      { appointmentViewId: 203, patientName: "Rahul Verma", appointmentDate: "2025-11-18", visitReason: "Checkup", patientPhone: "9123456780", doctorName: "Dr. Sharma", createdDate: "2025-11-17", status: "Pending" },
      { appointmentViewId: 204, patientName: "Simran Kaur", appointmentDate: "2025-11-17", visitReason: "Cold", patientPhone: "9865321470", doctorName: "Dr. Sharma", createdDate: "2025-11-16", status: "Cancelled" },
      { appointmentViewId: 205, patientName: "Aman Gupta", appointmentDate: "2025-11-16", visitReason: "Stomach Pain", patientPhone: "9456123780", doctorName: "Dr. Sharma", createdDate: "2025-11-15", status: "Pending" },

      { appointmentViewId: 206, patientName: "Priya Mehta", appointmentDate: "2025-11-15", visitReason: "Diabetes Check", patientPhone: "9876501234", doctorName: "Dr. Sharma", createdDate: "2025-11-14", status: "Completed" },
      { appointmentViewId: 207, patientName: "Vivek Yadav", appointmentDate: "2025-11-14", visitReason: "BP Issue", patientPhone: "9988123498", doctorName: "Dr. Sharma", createdDate: "2025-11-13", status: "Pending" },
      { appointmentViewId: 208, patientName: "Anjali Jain", appointmentDate: "2025-11-13", visitReason: "Migraine", patientPhone: "9123409876", doctorName: "Dr. Sharma", createdDate: "2025-11-12", status: "Completed" },
      { appointmentViewId: 209, patientName: "Sagar Joshi", appointmentDate: "2025-11-12", visitReason: "Vomiting", patientPhone: "9034567812", doctorName: "Dr. Sharma", createdDate: "2025-11-11", status: "Pending" },
      { appointmentViewId: 210, patientName: "Deepika Rao", appointmentDate: "2025-11-11", visitReason: "Cough", patientPhone: "9987012345", doctorName: "Dr. Sharma", createdDate: "2025-11-10", status: "Cancelled" },

      { appointmentViewId: 211, patientName: "Harsh Vardhan", appointmentDate: "2025-11-10", visitReason: "Knee Pain", patientPhone: "9876054321", doctorName: "Dr. Sharma", createdDate: "2025-11-09", status: "Completed" },
      { appointmentViewId: 212, patientName: "Pooja Soni", appointmentDate: "2025-11-09", visitReason: "Fever", patientPhone: "9123487650", doctorName: "Dr. Sharma", createdDate: "2025-11-08", status: "Pending" },
      { appointmentViewId: 213, patientName: "Mohit Arora", appointmentDate: "2025-11-08", visitReason: "Chest Pain", patientPhone: "9987643210", doctorName: "Dr. Sharma", createdDate: "2025-11-07", status: "Completed" },
      { appointmentViewId: 214, patientName: "Sneha Kapoor", appointmentDate: "2025-11-07", visitReason: "Allergy", patientPhone: "9876098766", doctorName: "Dr. Sharma", createdDate: "2025-11-06", status: "Pending" },
      { appointmentViewId: 215, patientName: "Akash Jain", appointmentDate: "2025-11-06", visitReason: "Skin Rash", patientPhone: "9123998877", doctorName: "Dr. Sharma", createdDate: "2025-11-05", status: "Completed" },

      { appointmentViewId: 216, patientName: "Rekha Devi", appointmentDate: "2025-11-05", visitReason: "Back Pain", patientPhone: "9876548888", doctorName: "Dr. Sharma", createdDate: "2025-11-04", status: "Pending" },
      { appointmentViewId: 217, patientName: "Tarun Gill", appointmentDate: "2025-11-04", visitReason: "Injury", patientPhone: "9988771122", doctorName: "Dr. Sharma", createdDate: "2025-11-03", status: "Completed" },
      { appointmentViewId: 218, patientName: "Kajal Malhotra", appointmentDate: "2025-11-03", visitReason: "Cold & Cough", patientPhone: "9877001122", doctorName: "Dr. Sharma", createdDate: "2025-11-02", status: "Pending" },
      { appointmentViewId: 219, patientName: "Rohit Singh", appointmentDate: "2025-11-02", visitReason: "High Fever", patientPhone: "9812345678", doctorName: "Dr. Sharma", createdDate: "2025-11-01", status: "Completed" },
      { appointmentViewId: 220, patientName: "Ishika Tiwari", appointmentDate: "2025-11-01", visitReason: "General Checkup", patientPhone: "9900112233", doctorName: "Dr. Sharma", createdDate: "2025-10-31", status: "Pending" }
    ];
      const savedData = JSON.parse(localStorage.getItem('appointments') || '[]');

      this.masterData = [...defaultData, ...savedData];
  }  

  applyFilter(tab: string) {
    this.activeTab = tab;
    this.pageNumber = 1;

    if (tab === "Upcoming") {
      this.filteredData = this.masterData.filter(x => x.status === "Pending");
    } else if (tab === "Completed") {
      this.filteredData = this.masterData.filter(x => x.status === "Completed");
    } else if (tab === "Cancelled") {
      this.filteredData = this.masterData.filter(x => x.status === "Cancelled");
    } else {
      this.filteredData = this.masterData;
    }

    if (this.searchText && this.searchText.trim() !== "") {
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
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    this.dataList = this.filteredData.slice(startIndex, startIndex + this.pageSize);
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
    return new Date(date).toDateString();
  }

  get upcomingCount() {
    return this.masterData.filter(x => x.status === "Pending").length;
  }

  get cancelledCount() {
    return this.masterData.filter(x => x.status === "Cancelled").length;
  }

  get completedCount() {
    return this.masterData.filter(x => x.status === "Completed").length;
  }
}