// drug-strength.component.ts
import { Component, OnInit } from '@angular/core';

interface DrugStrength {
  id: number;
  strength: string;
  status: string;
}

interface FormData {
  strength: string;
  status: string;
}

@Component({
  selector: 'app-drug-strength',
  standalone: false,
  templateUrl: './drugstrength.html',
  styleUrls: ['./drugstrength.css']
})
export class DrugStrengthComponent implements OnInit {
  drugList: DrugStrength[] = [];
  filteredDrugList: DrugStrength[] = [];
  paginatedDrugList: DrugStrength[] = [];  // ADD THIS
  entriesPerPage: number = 20;
  searchTerm: string = '';
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingDrugId: number | null = null;
  
  // ADD THESE PAGINATION PROPERTIES
  currentPage: number = 1;
  totalPages: number = 1;
  
  formData: FormData = {
    strength: '',
    status: 'Active'
  };

  ngOnInit(): void {
    this.loadDrugData();
  }

  loadDrugData(): void {
    this.drugList = [
      { id: 1, strength: '40 mg', status: 'Active' },
      { id: 2, strength: '20 mg', status: 'Active' },
      { id: 3, strength: '600mg', status: 'Active' },
      { id: 4, strength: '500mg', status: 'Active' },
      { id: 5, strength: '450mg', status: 'Active' },
      { id: 6, strength: '400mg', status: 'Active' },
      { id: 7, strength: '350mg', status: 'Active' },
      { id: 8, strength: '300mg', status: 'Active' },
      { id: 9, strength: '250mg', status: 'Active' },
      { id: 10, strength: '200mg', status: 'Active' },
      { id: 11, strength: '150mg', status: 'Active' },
      { id: 12, strength: '100mg', status: 'Active' },
      { id: 13, strength: '50mg', status: 'Active' },
      { id: 14, strength: '25mg', status: 'Active' },
      { id: 15, strength: '10mg', status: 'Active' }
    ];
    this.filterDrugList();
  }

  onSearch(): void {
    this.currentPage = 1;  // RESET TO PAGE 1
    this.filterDrugList();
  }

  onEntriesChange(): void {
    this.currentPage = 1;  // RESET TO PAGE 1
    this.updatePagination();
  }

  filterDrugList(): void {
    if (this.searchTerm.trim()) {
      this.filteredDrugList = this.drugList.filter(drug =>
        drug.strength.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDrugList = [...this.drugList];
    }
    this.updatePagination();  // ADD THIS
  }

  // ADD ALL THESE PAGINATION METHODS
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDrugList.length / this.entriesPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    this.paginatedDrugList = this.filteredDrugList.slice(startIndex, endIndex);
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
    return Math.min(this.currentPage * this.entriesPerPage, this.filteredDrugList.length);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingDrugId = null;
    this.formData = {
      strength: '',
      status: 'Active'
    };
    this.showModal = true;
  }

  openEditModal(id: number): void {
    const drug = this.drugList.find(d => d.id === id);
    if (drug) {
      this.isEditMode = true;
      this.editingDrugId = id;
      this.formData = {
        strength: drug.strength,
        status: drug.status
      };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingDrugId = null;
    this.formData = {
      strength: '',
      status: 'Active'
    };
  }

  saveDrugStrength(): void {
    if (!this.formData.strength.trim()) {
      alert('Please enter strength');
      return;
    }

    if (this.isEditMode && this.editingDrugId !== null) {
      const drug = this.drugList.find(d => d.id === this.editingDrugId);
      if (drug) {
        drug.strength = this.formData.strength;
        drug.status = this.formData.status;
      }
    } else {
      const newId = Math.max(...this.drugList.map(d => d.id), 0) + 1;
      this.drugList.push({
        id: newId,
        strength: this.formData.strength,
        status: this.formData.status
      });
    }

    this.filterDrugList();
    this.closeModal();
    alert(this.isEditMode ? 'Drug strength updated successfully!' : 'Drug strength created successfully!');
  }

  deleteDrugStrength(id: number): void {
    if (confirm('Are you sure you want to delete this drug strength?')) {
      this.drugList = this.drugList.filter(drug => drug.id !== id);
      this.filterDrugList();
      alert('Drug strength deleted successfully!');
    }
  }
}