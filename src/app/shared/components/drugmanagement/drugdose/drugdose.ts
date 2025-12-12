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
export class DrugdoseComponent implements OnInit {  // MAKE SURE THIS IS EXPORTED
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

  showModal = false;
  formData: Dose = { id: 0, dose: '', drugType: '', status: 'Active' };
  entriesPerPage = 20;
  searchTerm = '';
  filterType = '';
  drugTypes = ['Comprimido', 'Tab.', 'Ointment', 'Cap.'];

  get filteredDoses(): Dose[] {
    return this.doses.filter(dose => {
      const matchesSearch = dose.dose.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesFilter = !this.filterType || dose.drugType === this.filterType;
      return matchesSearch && matchesFilter;
    });
  }

  ngOnInit(): void {
    // Initialize component
  }

  openCreateModal(): void {
    this.formData = { id: 0, dose: '', drugType: '', status: 'Active' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { id: 0, dose: '', drugType: '', status: 'Active' };
  }

  createDose(): void {
    if (this.formData.dose.trim() && this.formData.drugType) {
      const newDose: Dose = {
        id: Math.max(...this.doses.map(d => d.id), 0) + 1,
        dose: this.formData.dose,
        drugType: this.formData.drugType,
        status: this.formData.status
      };
      this.doses.push(newDose);
      this.closeModal();
    }
  }

  deleteDose(id: number): void {
    this.doses = this.doses.filter(d => d.id !== id);
  }

  editDose(id: number): void {
    const dose = this.doses.find(d => d.id === id);
    if (dose) {
      this.formData = { ...dose };
      this.showModal = true;
    }
  }
}