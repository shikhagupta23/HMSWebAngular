// drug.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from "../../../shared-module";

interface DrugVariation {
  type: string;
  strength: string[];
  dose: string[];
  duration: string[];
  advice?: string;
}

interface Drug {
  id: number;
  tradeName: string;
  genericName: string;
  warning: string;
  note: string;
  sideEffect: string;
  variations: DrugVariation[];
}

interface FormData {
  tradeName: string;
  genericName: string;
  warning: string;
  note: string;
  sideEffect: string;
  additionalAdvice: string;
  variations: DrugVariation[];
}

@Component({
  selector: 'app-drug',
  standalone: false,
  templateUrl: './drug.html',
  styleUrls: ['./drug.css']
})
export class DrugComponent implements OnInit {
  drugList: Drug[] = [];
  filteredDrugList: Drug[] = [];
  entriesPerPage: number = 20;
  searchTerm: string = '';
  selectedFilterType: string = '';
  showCreateForm: boolean = false;
  isEditMode: boolean = false;
  editingDrugId: number | null = null;

  filterTypes = ['Tab.', 'Syrup', 'Injection', 'Gel', 'Ointment'];

  formData: FormData = {
    tradeName: '',
    genericName: '',
    warning: '',
    note: '',
    sideEffect: '',
    additionalAdvice: '',
    variations: []
  };

  ngOnInit(): void {
    this.loadDrugData();
  }

  loadDrugData(): void {
    this.drugList = [
      {
        id: 1,
        tradeName: 'Test trader',
        genericName: 'PCM',
        warning: 'ABCD',
        note: 'PCM 250',
        sideEffect: 'NA',
        variations: [
          {
            type: 'Tab.',
            strength: ['1mg'],
            dose: ['0+0+½'],
            duration: ['1 Day'],
            advice: ''
          },
          {
            type: 'Tab.',
            strength: ['25mg'],
            dose: ['0+0+½'],
            duration: ['5 Days'],
            advice: ''
          }
        ]
      },
      {
        id: 2,
        tradeName: 'Toradolin',
        genericName: 'Ketorolac',
        warning: 'After Meal must',
        note: '',
        sideEffect: '',
        variations: [
          {
            type: 'Tab.',
            strength: ['10mg', '5mg'],
            dose: ['1+1+1'],
            duration: ['7 Days'],
            advice: 'If pain'
          }
        ]
      },
      {
        id: 3,
        tradeName: 'Pantonix',
        genericName: 'Pantoprazole',
        warning: '',
        note: '',
        sideEffect: '',
        variations: [
          {
            type: 'Tab.',
            strength: ['20 mg', '40 mg'],
            dose: ['1+0+1'],
            duration: ['30 Daya'],
            advice: 'Before meal'
          }
        ]
      },
      {
        id: 4,
        tradeName: 'Pankaj',
        genericName: 'pankaj',
        warning: '',
        note: '',
        sideEffect: '',
        variations: [
          {
            type: 'Tab.',
            strength: ['1mg', '5mg', '2mg'],
            dose: [],
            duration: ['1 Day', '7 Days', '5 Days', '10 Days'],
            advice: ''
          }
        ]
      }
    ];
    this.filterDrugList();
  }

  onSearch(): void {
    this.filterDrugList();
  }

  onFilterChange(): void {
    this.filterDrugList();
  }

  filterDrugList(): void {
    let filtered = this.drugList;

    if (this.searchTerm.trim()) {
      filtered = filtered.filter(drug =>
        drug.tradeName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        drug.genericName.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedFilterType) {
      filtered = filtered.filter(drug =>
        drug.variations.some(v => v.type === this.selectedFilterType)
      );
    }

    this.filteredDrugList = filtered;
  }

  openCreateForm(): void {
    this.isEditMode = false;
    this.editingDrugId = null;
    this.formData = {
      tradeName: '',
      genericName: '',
      warning: '',
      note: '',
      sideEffect: '',
      additionalAdvice: '',
      variations: []
    };
    this.showCreateForm = true;
  }

  openEditForm(id: number): void {
    const drug = this.drugList.find(d => d.id === id);
    if (drug) {
      this.isEditMode = true;
      this.editingDrugId = id;
      this.formData = {
        tradeName: drug.tradeName,
        genericName: drug.genericName,
        warning: drug.warning,
        note: drug.note,
        sideEffect: drug.sideEffect,
        additionalAdvice: '',
        variations: JSON.parse(JSON.stringify(drug.variations))
      };
      this.showCreateForm = true;
    }
  }

  closeForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingDrugId = null;
    this.formData = {
      tradeName: '',
      genericName: '',
      warning: '',
      note: '',
      sideEffect: '',
      additionalAdvice: '',
      variations: []
    };
  }

  addVariation(): void {
    this.formData.variations.push({
      type: '',
      strength: [],
      dose: [],
      duration: [],
      advice: ''
    });
  }

  removeVariation(index: number): void {
    this.formData.variations.splice(index, 1);
  }

  saveDrug(): void {
    if (!this.formData.tradeName.trim() || !this.formData.genericName.trim()) {
      alert('Please fill in Trade name and Generic name');
      return;
    }

    if (this.formData.variations.length === 0) {
      alert('Please add at least one drug variation');
      return;
    }

    if (this.isEditMode && this.editingDrugId !== null) {
      const drug = this.drugList.find(d => d.id === this.editingDrugId);
      if (drug) {
        drug.tradeName = this.formData.tradeName;
        drug.genericName = this.formData.genericName;
        drug.warning = this.formData.warning;
        drug.note = this.formData.note;
        drug.sideEffect = this.formData.sideEffect;
        drug.variations = this.formData.variations;
      }
    } else {
      const newId = Math.max(...this.drugList.map(d => d.id), 0) + 1;
      this.drugList.push({
        id: newId,
        tradeName: this.formData.tradeName,
        genericName: this.formData.genericName,
        warning: this.formData.warning,
        note: this.formData.note,
        sideEffect: this.formData.sideEffect,
        variations: this.formData.variations
      });
    }

    this.filterDrugList();
    this.closeForm();
    alert(this.isEditMode ? 'Drug updated successfully!' : 'Drug created successfully!');
  }

  deleteDrug(id: number): void {
    if (confirm('Are you sure you want to delete this drug?')) {
      this.drugList = this.drugList.filter(drug => drug.id !== id);
      this.filterDrugList();
      alert('Drug deleted successfully!');
    }
  }

  parseArray(str: string): string[] {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s);
  }

  formatArray(arr: string[]): string {
    return arr.join(', ');
  }
}