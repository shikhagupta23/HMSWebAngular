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
  entriesPerPage: number = 20;
  searchTerm: string = '';
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingDrugDurationId: number | null = null;
  
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
      { id: 10, duration: '6 Month', status: 'Active' }
    ];
    this.filteredDrugDurationList = [...this.drugDurationList];
  }

  onSearch(): void {
    this.filterDrugDurationList();
  }

  onEntriesChange(): void {
    console.log(`Entries per page: ${this.entriesPerPage}`);
  }

  filterDrugDurationList(): void {
    if (this.searchTerm.trim()) {
      this.filteredDrugDurationList = this.drugDurationList.filter(drugDuration =>
        drugDuration.duration.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDrugDurationList = [...this.drugDurationList];
    }
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
      // Update existing drug duration
      const drugDuration = this.drugDurationList.find(d => d.id === this.editingDrugDurationId);
      if (drugDuration) {
        drugDuration.duration = this.formData.duration;
        drugDuration.status = this.formData.status;
      }
    } else {
      // Create new drug duration
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