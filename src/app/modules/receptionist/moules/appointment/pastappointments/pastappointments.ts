import { Component } from '@angular/core';

@Component({
  selector: 'app-pastappointments',
  standalone: false,
  templateUrl: './pastappointments.html',
  styleUrl: './pastappointments.scss',
})
export class Pastappointments {
dataList: any[] = [];

  pageNumber = 1;
  pageSize = 5;
  totalCount = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.loadData();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  loadData() {
    const today = this.getTodayDate();  // 🔥 today's date

    // FULL STATIC DATA LIST
    const allData = [
      { appointmentViewId: 101, patientName: "Ravi Kumar",appointmentDate: "2025-11-15", visitReason: "Fever", patientPhone: "9876543210", doctorName: "Dr. Mehta", createdDate: "2025-01-14", status: "Pending" },
      { appointmentViewId: 102, patientName: "Neha Sharma", appointmentDate: "2025-11-16", visitReason: "Headache", patientPhone: "9988776655", doctorName: "Dr. Rakesh", createdDate: "2025-01-15", status: "Completed" },
      { appointmentViewId: 103, patientName: "Rahul Verma", appointmentDate: "2025-11-17", visitReason: "Checkup", patientPhone: "9123456780", doctorName: "Dr. Arora", createdDate: "2025-01-16", status: "Pending" },
      { appointmentViewId: 104, patientName: "Simran", appointmentDate: "2025-11-18", visitReason: "Cold", patientPhone: "9865321470", doctorName: "Dr. Mehta", createdDate: "2025-01-17", status: "Cancelled" },
      { appointmentViewId: 105, patientName: "Aman Gupta", appointmentDate: "2025-11-19", visitReason: "Stomach Pain", patientPhone: "9456123780", doctorName: "Dr. Sharma", createdDate: "2025-01-18", status: "Pending" },
      { appointmentViewId: 106, patientName: "Priya Singh", appointmentDate: "2025-11-20", visitReason: "Migraine", patientPhone: "9651234789", doctorName: "Dr. Mehta", createdDate: "2025-01-19", status: "Completed" },

      { appointmentViewId: 107, patientName: "Raja Kumar", appointmentDate: "2025-11-13", visitReason: "Fever", patientPhone: "9876543210", doctorName: "Dr. Arora", createdDate: "2025-01-11", status: "Pending" },
      { appointmentViewId: 108, patientName: "Pooja Sharma", appointmentDate: "2025-11-10", visitReason: "Headache", patientPhone: "9090776655", doctorName: "Dr. Rakesh", createdDate: "2025-01-02", status: "Completed"  },
      { appointmentViewId: 109, patientName: "Amit Verma", appointmentDate: "2025-11-04", visitReason: "Checkup", patientPhone: "9999456780", doctorName: "Dr. Sharma", createdDate: "2025-01-23", status: "Pending"  },
      { appointmentViewId: 110, patientName: "Shiru", appointmentDate: "2025-11-05", visitReason: "Cold", patientPhone: "9865000070", doctorName: "Dr. Sharma", createdDate: "2025-01-04", status: "Pending"  },
      { appointmentViewId: 111, patientName: "Seema Gupta", appointmentDate: "2025-11-11", visitReason: "Stomach Pain", patientPhone: "9400123780", doctorName: "Dr. Rakesh", createdDate: "2025-01-10", status: "Completed"  },
      { appointmentViewId: 112, patientName: "Divya Singh", appointmentDate: "2025-11-07", visitReason: "Migraine", patientPhone: "9653334789", doctorName: "Dr. Rakesh", createdDate: "2025-01-01", status: "Completed"  }
    ];

    // REQUIRED FIELDS (your API sends these!)
    this.totalCount = allData.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);

    // 🔥 MOST IMPORTANT PART – SLICING DATA
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    this.dataList = allData.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadData();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadData();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadData();
    }
  }

  formatDate(date: string) {
    return new Date(date).toDateString();
  }
}
