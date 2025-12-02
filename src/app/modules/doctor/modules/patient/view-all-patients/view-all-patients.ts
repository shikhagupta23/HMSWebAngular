import { Component, inject, OnInit } from '@angular/core';
import { PatientService } from '../services/patient-service';

@Component({
  selector: 'app-view-all-patients',
  standalone: false,
  templateUrl: './view-all-patients.html',
  styleUrl: './view-all-patients.scss',
})
export class ViewAllPatients implements OnInit {

  private patientService = inject(PatientService);

  patientList: any[] = [];
  filteredPatients: any[] = [];
  paginatedPatients: any[] = [];

  searchText = "";
  pageNumber = 1;
  pageSize = 10;
  totalPages = 0;

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.patientService.getPatients(
      this.pageNumber,
      this.pageSize,
      this.searchText
    ).subscribe({
      next: (response) => {

        console.log("API Response:", response);

        this.patientList = response.dataList;

        this.filteredPatients = [...this.patientList];

        // Update pagination based on API response
        this.totalPages = response.totalPages;

        this.paginatedPatients = this.filteredPatients; // API already gives paginated data
      },
      error: (err) => {
        console.error("API Error:", err);
      }
    });
  }

  // 🔎 Search — call API again with search text
  searchPatients() {
    this.pageNumber = 1;
    this.loadPatients();
  }

  // ⏭ Next Page
  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadPatients();
    }
  }

  // ⏮ Previous Page
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadPatients();
    }
  }

  // Go to a page
  goToPage(page: number) {
    this.pageNumber = page;
    this.loadPatients();
  }
}
