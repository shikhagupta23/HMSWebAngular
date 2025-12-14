import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Dose {
  id: number;
  dose: string;
  drugType: string;
  status: string;
}

@Component({
  selector: 'app-drugdose',
  standalone: false,
  templateUrl: './drugdose.html',
  styleUrls: ['./drugdose.css']
})
export class DrugdoseComponent implements OnInit {
  doses: Dose[] = [
    { id: 1, dose: '1 Comp/dia', drugType: 'Comprimido', status: 'Active' },
    { id: 2, dose: '1 comp/dia (noite)', drugType: 'Comprimido', status: 'Active' },
    { id: 3, dose: '1 comp 6/6h', drugType: 'Comprimido', status: 'Active' },
    { id: 4, dose: '3 TIMES', drugType: 'Tab.', status: 'Active' },
    { id: 5, dose: 'Testing 1', drugType: 'Tab.', status: 'Active' },
    { id: 6, dose: 'Harma', drugType: 'Tab.', status: 'Active' },
    { id: 7, dose: 'রাতে মুখ ও মাথার তালু ছোড়া সপ্তর পরীরে নাগাবেন', drugType: 'Ointment', status: 'Active' },
    { id: 8, dose: '१+१+१', drugType: 'Cap.', status: 'Active' },
    { id: 9, dose: '1+1+1+1', drugType: 'Cap.', status: 'Active' }
  ];

  filteredDoses: Dose[] = [];
  paginatedDoses: Dose[] = [];
  showModal = false;
  isEditMode = false;
  formData: Dose = { id: 0, dose: '', drugType: '', status: 'Active' };
  entriesPerPage = 20;
  searchTerm = '';
  filterType = '';
  drugTypes = ['Comprimido', 'Tab.', 'Ointment', 'Cap.'];

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredDoses = this.doses.filter(dose => {
      const matchesSearch = dose.dose.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesFilter = !this.filterType || dose.drugType === this.filterType;
      return matchesSearch && matchesFilter;
    });
    this.updatePagination();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDoses.length / this.entriesPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    this.paginatedDoses = this.filteredDoses.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.entriesPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.entriesPerPage, this.filteredDoses.length);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = { id: 0, dose: '', drugType: '', status: 'Active' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { id: 0, dose: '', drugType: '', status: 'Active' };
    this.isEditMode = false;
  }

  createDose(): void {
    if (this.formData.dose.trim() && this.formData.drugType) {
      if (this.isEditMode) {
        // Update existing dose
        const index = this.doses.findIndex(d => d.id === this.formData.id);
        if (index !== -1) {
          this.doses[index] = { ...this.formData };
        }
      } else {
        // Create new dose
        const newDose: Dose = {
          id: Math.max(...this.doses.map(d => d.id), 0) + 1,
          dose: this.formData.dose,
          drugType: this.formData.drugType,
          status: this.formData.status
        };
        this.doses.push(newDose);
      }
      this.closeModal();
      this.applyFilters();
    }
  }

  deleteDose(id: number): void {
    if (confirm('Are you sure you want to delete this dose?')) {
      this.doses = this.doses.filter(d => d.id !== id);
      this.applyFilters();
    }
  }

  editDose(id: number): void {
    const dose = this.doses.find(d => d.id === id);
    if (dose) {
      this.isEditMode = true;
      this.formData = { ...dose };
      this.showModal = true;
    }
  }
}