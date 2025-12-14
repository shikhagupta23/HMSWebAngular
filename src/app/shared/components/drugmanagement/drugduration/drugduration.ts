// drug-duration.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface DrugDuration {
  id: number;
  duration: string;
  status: string;
}

interface FormData {
  duration: string;
  status: string;
}

@Component({
  selector: 'app-drug-duration',
  standalone: false,
  templateUrl: './drugduration.html',
  styleUrls: ['./drugduration.css']
})
export class DrugDurationComponent implements OnInit {
  drugDurationList: DrugDuration[] = [];
  filteredDrugDurationList: DrugDuration[] = [];
  paginatedDrugDurationList: DrugDuration[] = [];
  entriesPerPage: number = 20;
  searchTerm: string = '';
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingDrugDurationId: number | null = null;
  
  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  
  formData: FormData = {
    duration: '',
    status: 'Active'
  };

  ngOnInit(): void {
    this.loadDrugDurationData();
  }

  loadDrugDurationData(): void {
    this.drugDurationList = [
      { id: 1, duration: '30 Daya', status: 'Active' },
      { id: 2, duration: '7 Dias', status: 'Active' },
      { id: 3, duration: '30 dias', status: 'Active' },
      { id: 4, duration: '30', status: 'Active' },
      { id: 5, duration: '7', status: 'Active' },
      { id: 6, duration: '7 dias', status: 'Active' },
      { id: 7, duration: '50', status: 'Active' },
      { id: 8, duration: '৫ দিন', status: 'Active' },
      { id: 9, duration: '1 Year', status: 'Active' },
      { id: 10, duration: '6 Month', status: 'Active' },
      { id: 11, duration: '3 Months', status: 'Active' },
      { id: 12, duration: '1 Month', status: 'Active' },
      { id: 13, duration: '2 Weeks', status: 'Active' },
      { id: 14, duration: '10 Days', status: 'Active' },
      { id: 15, duration: '14 Days', status: 'Active' }
    ];
    this.filterDrugDurationList();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.filterDrugDurationList();
  }

  onEntriesChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  filterDrugDurationList(): void {
    if (this.searchTerm.trim()) {
      this.filteredDrugDurationList = this.drugDurationList.filter(drugDuration =>
        drugDuration.duration.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDrugDurationList = [...this.drugDurationList];
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDrugDurationList.length / this.entriesPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    this.paginatedDrugDurationList = this.filteredDrugDurationList.slice(startIndex, endIndex);
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
        pages.push(-1);
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.entriesPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.entriesPerPage, this.filteredDrugDurationList.length);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingDrugDurationId = null;
    this.formData = {
      duration: '',
      status: 'Active'
    };
    this.showModal = true;
  }

  openEditModal(id: number): void {
    const drugDuration = this.drugDurationList.find(d => d.id === id);
    if (drugDuration) {
      this.isEditMode = true;
      this.editingDrugDurationId = id;
      this.formData = {
        duration: drugDuration.duration,
        status: drugDuration.status
      };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingDrugDurationId = null;
    this.formData = {
      duration: '',
      status: 'Active'
    };
  }

  saveDrugDuration(): void {
    if (!this.formData.duration.trim()) {
      alert('Please enter drug duration');
      return;
    }

    if (this.isEditMode && this.editingDrugDurationId !== null) {
      const drugDuration = this.drugDurationList.find(d => d.id === this.editingDrugDurationId);
      if (drugDuration) {
        drugDuration.duration = this.formData.duration;
        drugDuration.status = this.formData.status;
      }
    } else {
      const newId = Math.max(...this.drugDurationList.map(d => d.id), 0) + 1;
      this.drugDurationList.push({
        id: newId,
        duration: this.formData.duration,
        status: this.formData.status
      });
    }

    this.filterDrugDurationList();
    this.closeModal();
    alert(this.isEditMode ? 'Drug duration updated successfully!' : 'Drug duration created successfully!');
  }

  deleteDrugDuration(id: number): void {
    if (confirm('Are you sure you want to delete this drug duration?')) {
      this.drugDurationList = this.drugDurationList.filter(drugDuration => drugDuration.id !== id);
      this.filterDrugDurationList();
      alert('Drug duration deleted successfully!');
    }
  }
}