import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-upcoming-appointments',
  standalone: false,
  templateUrl: './view-upcoming-appointments.html',
  styleUrl: './view-upcoming-appointments.scss',
})
export class ViewUpcomingAppointments implements OnInit {

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
      { appointmentViewId: 101, patientName: "Ravi Kumar",appointmentDate: today, visitReason: "Fever", patientPhone: "9876543210", doctorName: "Dr. Mehta", createdDate: "2025-01-14", status: "Pending" },
      { appointmentViewId: 102, patientName: "Neha Sharma", appointmentDate: today, visitReason: "Headache", patientPhone: "9988776655", doctorName: "Dr. Rakesh", createdDate: "2025-01-15", status: "Completed" },
      { appointmentViewId: 103, patientName: "Rahul Verma", appointmentDate: today, visitReason: "Checkup", patientPhone: "9123456780", doctorName: "Dr. Arora", createdDate: "2025-01-16", status: "Pending" },
      { appointmentViewId: 104, patientName: "Simran", appointmentDate: today, visitReason: "Cold", patientPhone: "9865321470", doctorName: "Dr. Mehta", createdDate: "2025-01-17", status: "Cancelled" },
      { appointmentViewId: 105, patientName: "Aman Gupta", appointmentDate: today, visitReason: "Stomach Pain", patientPhone: "9456123780", doctorName: "Dr. Sharma", createdDate: "2025-01-18", status: "Pending" },
      { appointmentViewId: 106, patientName: "Priya Singh", appointmentDate: today, visitReason: "Migraine", patientPhone: "9651234789", doctorName: "Dr. Mehta", createdDate: "2025-01-19", status: "Completed" },

      { appointmentViewId: 107, patientName: "Raja Kumar", appointmentDate: today, visitReason: "Fever", patientPhone: "9876543210", doctorName: "Dr. Arora", createdDate: "2025-01-20", status: "Pending" },
      { appointmentViewId: 108, patientName: "Pooja Sharma", appointmentDate: today, visitReason: "Headache", patientPhone: "9090776655", doctorName: "Dr. Rakesh", createdDate: "2025-01-09", status: "Completed"  },
      { appointmentViewId: 109, patientName: "Amit Verma", appointmentDate: today, visitReason: "Checkup", patientPhone: "9999456780", doctorName: "Dr. Sharma", createdDate: "2025-01-22", status: "Pending"  },
      { appointmentViewId: 110, patientName: "Shiru", appointmentDate: today, visitReason: "Cold", patientPhone: "9865000070", doctorName: "Dr. Sharma", createdDate: "2025-01-24", status: "Pending"  },
      { appointmentViewId: 111, patientName: "Seema Gupta", appointmentDate: today, visitReason: "Stomach Pain", patientPhone: "9400123780", doctorName: "Dr. Rakesh", createdDate: "2025-01-25", status: "Completed"  },
      { appointmentViewId: 112, patientName: "Divya Singh", appointmentDate: today, visitReason: "Migraine", patientPhone: "9653334789", doctorName: "Dr. Rakesh", createdDate: "2025-01-23", status: "Completed"  }
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


