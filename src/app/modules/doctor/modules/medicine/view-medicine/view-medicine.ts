import { Component, inject, OnInit } from '@angular/core';
import { MedicineService } from '../Services/medicine-sevice';


@Component({
  selector: 'app-view-medicines',
  standalone: false,
  templateUrl: './view-medicine.html',
  styleUrls: ['./view-medicine.scss'],
})
export class ViewMedicine implements OnInit {

  medicineList: any[] = [];
  filteredMedicines: any[] = [];
  paginatedMedicines: any[] = [];
  private medicineService = inject(MedicineService);

  searchText = "";

  pageNumber = 1;
  pageSize = 10;
  totalPages = 0;

  ngOnInit() {
    // const saved = JSON.parse(localStorage.getItem("medicines") || "[]");
    // this.medicineList = saved.map((m: any, i: number) => ({ ...m, id: i + 1 }));

    // this.filteredMedicines = [...this.medicineList];
        this.loadMedicinesFromAPI();

    this.applyPagination();
  }

    // ✅ Call service and print in console
    loadMedicinesFromAPI() {
      this.medicineService.getMedicine(100).subscribe({
        next: (response: any) => {
          console.log("API Response:", response);

          // ✅ Bind dataList correctly
          this.medicineList = response.dataList || [];

          // Optional: Use backend pagination info
          // this.pageNumber = response.pageNumber;
          // this.pageSize = response.pageSize;
          // this.totalPages = response.totalPages;

          this.filteredMedicines = [...this.medicineList];
          this.applyPagination();
        },
        error: (err) => {
          console.error("Error loading medicines:", err);
        }
      });
}


  // searchMedicines() {
  //   const s = this.searchText.toLowerCase();

  //   this.filteredMedicines = this.medicineList.filter(m =>
  //     m.medicineName.toLowerCase().includes(s) ||
  //     m.medicineType.toLowerCase().includes(s) ||
  //     (m.manufacturerName && m.manufacturerName.toLowerCase().includes(s))
  //   );

  //   this.pageNumber = 1;
  //   this.applyPagination();
  // }


searchMedicines() {
  const s = this.searchText.toLowerCase().trim();

  this.filteredMedicines = this.medicineList.filter(m => {
    const name = String(m.medicineName || '').toLowerCase();
    const type = String(m.medicineType || '').toLowerCase();
    const manufacturer = String(m.manufacturerName || '').toLowerCase();

    return (
      name.includes(s) ||
      type.includes(s) ||
      manufacturer.includes(s)
    );
  });

  this.pageNumber = 1;
  this.applyPagination();
}


 
// -----------------------------------


  applyPagination() {
    this.totalPages = Math.ceil(this.filteredMedicines.length / this.pageSize);

    const start = (this.pageNumber - 1) * this.pageSize;
    this.paginatedMedicines = this.filteredMedicines.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    this.pageNumber = p;
    this.applyPagination();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.applyPagination();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.applyPagination();
    }
  }

  //   get scheduledCount() {
  //   return this.masterData.filter(x => x.status === 0).length;
  // }
   
  


}
