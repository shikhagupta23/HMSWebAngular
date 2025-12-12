// drug-type.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface DrugType {
  id: number;
  type: string;
  status: string;
}

interface FormData {
  type: string;
  status: string;
}

@Component({
  selector: 'app-drug-type',
  standalone: false,
  templateUrl: './drugtype.html',
  styleUrls: ['./drugtype.css']
})
export class DrugTypeComponent implements OnInit {
  drugTypeList: DrugType[] = [];
  filteredDrugTypeList: DrugType[] = [];
  entriesPerPage: number = 20;
  searchTerm: string = '';
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingDrugTypeId: number | null = null;
  
  formData: FormData = {
    type: '',
    status: 'Active'
  };

  ngOnInit(): void {
    this.loadDrugTypeData();
  }

  loadDrugTypeData(): void {
    this.drugTypeList = [
      { id: 1, type: 'Comprimido', status: 'Active' },
      { id: 2, type: 'Suppository', status: 'Active' },
      { id: 3, type: 'Gel', status: 'Active' },
      { id: 4, type: 'Suspension', status: 'Active' },
      { id: 5, type: 'Nasal Drop', status: 'Active' },
      { id: 6, type: 'Drop', status: 'Active' },
      { id: 7, type: 'Eye Drop', status: 'Active' },
      { id: 8, type: 'Eye Ointment', status: 'Active' },
      { id: 9, type: 'Ointment', status: 'Active' },
      { id: 10, type: 'Inj.', status: 'Active' }
    ];
    this.filteredDrugTypeList = [...this.drugTypeList];
  }

  onSearch(): void {
    this.filterDrugTypeList();
  }

  onEntriesChange(): void {
    console.log(`Entries per page: ${this.entriesPerPage}`);
  }

  filterDrugTypeList(): void {
    if (this.searchTerm.trim()) {
      this.filteredDrugTypeList = this.drugTypeList.filter(drugType =>
        drugType.type.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDrugTypeList = [...this.drugTypeList];
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingDrugTypeId = null;
    this.formData = {
      type: '',
      status: 'Active'
    };
    this.showModal = true;
  }

  openEditModal(id: number): void {
    const drugType = this.drugTypeList.find(d => d.id === id);
    if (drugType) {
      this.isEditMode = true;
      this.editingDrugTypeId = id;
      this.formData = {
        type: drugType.type,
        status: drugType.status
      };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingDrugTypeId = null;
    this.formData = {
      type: '',
      status: 'Active'
    };
  }

  saveDrugType(): void {
    if (!this.formData.type.trim()) {
      alert('Please enter drug type');
      return;
    }

    if (this.isEditMode && this.editingDrugTypeId !== null) {
      // Update existing drug type
      const drugType = this.drugTypeList.find(d => d.id === this.editingDrugTypeId);
      if (drugType) {
        drugType.type = this.formData.type;
        drugType.status = this.formData.status;
      }
    } else {
      // Create new drug type
      const newId = Math.max(...this.drugTypeList.map(d => d.id), 0) + 1;
      this.drugTypeList.push({
        id: newId,
        type: this.formData.type,
        status: this.formData.status
      });
    }

    this.filterDrugTypeList();
    this.closeModal();
    alert(this.isEditMode ? 'Drug type updated successfully!' : 'Drug type created successfully!');
  }

  deleteDrugType(id: number): void {
    if (confirm('Are you sure you want to delete this drug type?')) {
      this.drugTypeList = this.drugTypeList.filter(drugType => drugType.id !== id);
      this.filterDrugTypeList();
      alert('Drug type deleted successfully!');
    }
  }
}