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
  entriesPerPage: number = 20;
  searchTerm: string = '';
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingDrugId: number | null = null;
  
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
      { id: 10, strength: '200mg', status: 'Active' }
    ];
    this.filterDrugList();
  }

  onSearch(): void {
    this.filterDrugList();
  }

  onEntriesChange(): void {
    // Handle entries per page change
    console.log(`Entries per page: ${this.entriesPerPage}`);
  }

  filterDrugList(): void {
    if (this.searchTerm.trim()) {
      this.filteredDrugList = this.drugList.filter(drug =>
        drug.strength.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredDrugList = [...this.drugList];
    }
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
      // Update existing drug strength
      const drug = this.drugList.find(d => d.id === this.editingDrugId);
      if (drug) {
        drug.strength = this.formData.strength;
        drug.status = this.formData.status;
      }
    } else {
      // Create new drug strength
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