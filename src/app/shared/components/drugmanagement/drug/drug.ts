import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environment/environment.delvelopment';

// Dropdown interface
interface DropdownDto {
  id: string;
  name: string;
}

interface DrugVariation {
  drugVariationId?: string;
  drugTypeId: string;
  drugStrengthIds: string[];
  drugDoseIds: string[];
  drugDurationIds: string[];
  advice?: string;
  // Search and dropdown state
  strengthSearch?: string;
  doseSearch?: string;
  durationSearch?: string;
  showStrengthDropdown?: boolean;
  showDoseDropdown?: boolean;
  showDurationDropdown?: boolean;
  filteredStrengths?: DropdownDto[];
  filteredDoses?: DropdownDto[];
  filteredDurations?: DropdownDto[];
}

interface Drug {
  drugId: string;
  tradeName: string;
  genericName: string;
  warning: string;
  note: string;
  sideEffect: string;
  isActive: boolean;
  variations: DrugVariation[];
  createdAt?: string;
  updatedAt?: string;
}

interface DrugResponse {
  dataList: Drug[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isSuccess: boolean;
  message: string;
  id?: string;
}

interface ApiResponse {
  isSuccess: boolean;
  message: string;
  id?: string;
}

interface FormData {
  tradeName: string;
  genericName: string;
  warning: string;
  note: string;
  sideEffect: string;
  additionalAdvice: string;
  isActive: boolean;
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
  paginatedDrugList: Drug[] = [];
  entriesPerPage: number = 10;
  searchTerm: string = '';
  selectedFilterType: string = '';
  showCreateForm: boolean = false;
  isEditMode: boolean = false;
  editingDrugId: string | null = null;
  isLoading = false;
  error = '';

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // Dropdown data
  drugTypes: DropdownDto[] = [];
  drugStrengths: DropdownDto[] = [];
  drugDoses: DropdownDto[] = [];
  drugDurations: DropdownDto[] = [];

  formData: FormData = {
    tradeName: '',
    genericName: '',
    warning: '',
    note: '',
    sideEffect: '',
    additionalAdvice: '',
    isActive: true,
    variations: []
  };

  // API Endpoints
  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/getAllDrug',
    CREATE: '/DrugManagement/createDrug',
    UPDATE: '/DrugManagement/updateDrug',
    DELETE: '/DrugManagement/deleteDrug',
    DROPDOWN_TYPE: '/DrugManagement/drugTypeDropdown',
    DROPDOWN_STRENGTH: '/DrugManagement/drugStrengthDropdown',
    DROPDOWN_DOSE: '/DrugManagement/drugDoseDropdown',
    DROPDOWN_DURATION: '/DrugManagement/drugDurationDropdown'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllDropdowns();
    this.loadDrugs();
  }

  loadAllDropdowns(): void {
    this.loadDrugTypes();
    this.loadDrugStrengths();
    this.loadDrugDoses();
    this.loadDrugDurations();
  }

  loadDrugTypes(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_TYPE}`;
    
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => {
        this.drugTypes = response || [];
      },
      error: (err) => {
        console.error('Error loading drug types:', err);
        this.drugTypes = [];
      }
    });
  }

  loadDrugStrengths(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_STRENGTH}`;
    
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => {
        this.drugStrengths = response || [];
      },
      error: (err) => {
        console.error('Error loading drug strengths:', err);
        this.drugStrengths = [];
      }
    });
  }

  loadDrugDoses(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_DOSE}`;
    
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => {
        this.drugDoses = response || [];
      },
      error: (err) => {
        console.error('Error loading drug doses:', err);
        this.drugDoses = [];
      }
    });
  }

  loadDrugDurations(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_DURATION}`;
    
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => {
        this.drugDurations = response || [];
      },
      error: (err) => {
        console.error('Error loading drug durations:', err);
        this.drugDurations = [];
      }
    });
  }

  loadDrugs(): void {
    this.isLoading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

    if (this.searchTerm && this.searchTerm.trim()) {
      params = params.set('searchTerm', this.searchTerm.trim());
    }

    if (this.selectedFilterType) {
      params = params.set('drugTypeId', this.selectedFilterType);
    }

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;

    this.http.get<DrugResponse>(apiUrl, { params }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.drugList = response.dataList || [];
          this.paginatedDrugList = response.dataList || [];
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.filteredDrugList = response.dataList || [];
        } else {
          this.error = response.message || 'Failed to load drug data';
          this.drugList = [];
          this.paginatedDrugList = [];
          this.filteredDrugList = [];
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load drug data';
        console.error('API Error:', err);
        this.drugList = [];
        this.paginatedDrugList = [];
        this.filteredDrugList = [];
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadDrugs();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadDrugs();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugs();
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
    return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.entriesPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.entriesPerPage, this.totalCount);
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
      isActive: true,
      variations: []
    };
    this.showCreateForm = true;
  }

  openEditForm(drugId: string): void {
    const drug = this.drugList.find(d => d.drugId === drugId);
    if (drug) {
      this.isEditMode = true;
      this.editingDrugId = drugId;
      this.formData = {
        tradeName: drug.tradeName,
        genericName: drug.genericName,
        warning: drug.warning,
        note: drug.note,
        sideEffect: drug.sideEffect,
        additionalAdvice: '',
        isActive: drug.isActive,
        variations: JSON.parse(JSON.stringify(drug.variations)).map((v: DrugVariation) => ({
          ...v,
          strengthSearch: '',
          doseSearch: '',
          durationSearch: '',
          showStrengthDropdown: false,
          showDoseDropdown: false,
          showDurationDropdown: false,
          filteredStrengths: [],
          filteredDoses: [],
          filteredDurations: []
        }))
      };
      this.showCreateForm = true;
    }
  }

  closeForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingDrugId = null;
  }

  addVariation(): void {
    this.formData.variations.push({
      drugTypeId: '',
      drugStrengthIds: [],
      drugDoseIds: [],
      drugDurationIds: [],
      advice: '',
      strengthSearch: '',
      doseSearch: '',
      durationSearch: '',
      showStrengthDropdown: false,
      showDoseDropdown: false,
      showDurationDropdown: false,
      filteredStrengths: [],
      filteredDoses: [],
      filteredDurations: []
    });
  }

  removeVariation(index: number): void {
    this.formData.variations.splice(index, 1);
  }

  // ========== SEARCHABLE DROPDOWN METHODS ==========

  // Strength Methods
  filterStrengths(index: number): void {
    const variation = this.formData.variations[index];
    const searchTerm = (variation.strengthSearch || '').toLowerCase();
    
    if (searchTerm) {
      variation.filteredStrengths = this.drugStrengths.filter(s => 
        s.name.toLowerCase().includes(searchTerm) && 
        !variation.drugStrengthIds.includes(s.id)
      );
    } else {
      variation.filteredStrengths = this.drugStrengths.filter(s => 
        !variation.drugStrengthIds.includes(s.id)
      );
    }
    variation.showStrengthDropdown = true;
  }

  getFilteredStrengths(index: number): DropdownDto[] {
    return this.formData.variations[index].filteredStrengths || [];
  }

  showStrengthDropdown(index: number): void {
    this.formData.variations[index].showStrengthDropdown = true;
    this.filterStrengths(index);
  }

  hideStrengthDropdown(index: number): void {
    setTimeout(() => {
      this.formData.variations[index].showStrengthDropdown = false;
    }, 200);
  }

  selectStrength(index: number, strengthId: string): void {
    const variation = this.formData.variations[index];
    if (!variation.drugStrengthIds.includes(strengthId)) {
      variation.drugStrengthIds.push(strengthId);
    }
    variation.strengthSearch = '';
    variation.showStrengthDropdown = false;
    this.filterStrengths(index);
  }

  // Dose Methods
  filterDoses(index: number): void {
    const variation = this.formData.variations[index];
    const searchTerm = (variation.doseSearch || '').toLowerCase();
    
    if (searchTerm) {
      variation.filteredDoses = this.drugDoses.filter(d => 
        d.name.toLowerCase().includes(searchTerm) && 
        !variation.drugDoseIds.includes(d.id)
      );
    } else {
      variation.filteredDoses = this.drugDoses.filter(d => 
        !variation.drugDoseIds.includes(d.id)
      );
    }
    variation.showDoseDropdown = true;
  }

  getFilteredDoses(index: number): DropdownDto[] {
    return this.formData.variations[index].filteredDoses || [];
  }

  showDoseDropdown(index: number): void {
    this.formData.variations[index].showDoseDropdown = true;
    this.filterDoses(index);
  }

  hideDoseDropdown(index: number): void {
    setTimeout(() => {
      this.formData.variations[index].showDoseDropdown = false;
    }, 200);
  }

  selectDose(index: number, doseId: string): void {
    const variation = this.formData.variations[index];
    if (!variation.drugDoseIds.includes(doseId)) {
      variation.drugDoseIds.push(doseId);
    }
    variation.doseSearch = '';
    variation.showDoseDropdown = false;
    this.filterDoses(index);
  }

  // Duration Methods
  filterDurations(index: number): void {
    const variation = this.formData.variations[index];
    const searchTerm = (variation.durationSearch || '').toLowerCase();
    
    if (searchTerm) {
      variation.filteredDurations = this.drugDurations.filter(d => 
        d.name.toLowerCase().includes(searchTerm) && 
        !variation.drugDurationIds.includes(d.id)
      );
    } else {
      variation.filteredDurations = this.drugDurations.filter(d => 
        !variation.drugDurationIds.includes(d.id)
      );
    }
    variation.showDurationDropdown = true;
  }

  getFilteredDurations(index: number): DropdownDto[] {
    return this.formData.variations[index].filteredDurations || [];
  }

  showDurationDropdown(index: number): void {
    this.formData.variations[index].showDurationDropdown = true;
    this.filterDurations(index);
  }

  hideDurationDropdown(index: number): void {
    setTimeout(() => {
      this.formData.variations[index].showDurationDropdown = false;
    }, 200);
  }

  selectDuration(index: number, durationId: string): void {
    const variation = this.formData.variations[index];
    if (!variation.drugDurationIds.includes(durationId)) {
      variation.drugDurationIds.push(durationId);
    }
    variation.durationSearch = '';
    variation.showDurationDropdown = false;
    this.filterDurations(index);
  }

  // ========== END SEARCHABLE DROPDOWN METHODS ==========

  saveDrug(): void {
    if (!this.formData.tradeName.trim() || !this.formData.genericName.trim()) {
      alert('Please fill in Trade name and Generic name');
      return;
    }

    if (this.formData.variations.length === 0) {
      alert('Please add at least one drug variation');
      return;
    }

    // Validate variations
    for (let i = 0; i < this.formData.variations.length; i++) {
      const variation = this.formData.variations[i];
      if (!variation.drugTypeId) {
        alert(`Please select a drug type for variation ${i + 1}`);
        return;
      }
    }

    // Clean up variations before sending
    const cleanedVariations = this.formData.variations.map(v => ({
      drugVariationId: v.drugVariationId,
      drugTypeId: v.drugTypeId,
      drugStrengthIds: v.drugStrengthIds,
      drugDoseIds: v.drugDoseIds,
      drugDurationIds: v.drugDurationIds,
      advice: v.advice
    }));

    if (this.isEditMode && this.editingDrugId) {
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}/${this.editingDrugId}`;
      
      const updateData = {
        tradeName: this.formData.tradeName,
        genericName: this.formData.genericName,
        warning: this.formData.warning,
        note: this.formData.note,
        sideEffect: this.formData.sideEffect,
        isActive: this.formData.isActive,
        variations: cleanedVariations
      };
      
      this.http.put<ApiResponse>(updateUrl, updateData).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            alert('Drug updated successfully!');
            this.closeForm();
            this.loadDrugs();
          } else {
            alert(response.message || 'Failed to update drug');
          }
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Failed to update drug. Please try again.');
        }
      });
    } else {
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
      const createData = {
        tradeName: this.formData.tradeName,
        genericName: this.formData.genericName,
        warning: this.formData.warning,
        note: this.formData.note,
        sideEffect: this.formData.sideEffect,
        isActive: this.formData.isActive,
        variations: cleanedVariations
      };
      
      this.http.post<ApiResponse>(createUrl, createData).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            alert('Drug created successfully!');
            this.closeForm();
            this.loadDrugs();
          } else {
            alert(response.message || 'Failed to create drug');
          }
        },
        error: (err) => {
          console.error('Create error:', err);
          alert('Failed to create drug. Please try again.');
        }
      });
    }
  }

  deleteDrug(drugId: string): void {
    if (confirm('Are you sure you want to delete this drug?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}/${drugId}`;
      
      this.http.delete<ApiResponse>(deleteUrl).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            alert('Drug deleted successfully!');
            this.loadDrugs();
          } else {
            alert(response.message || 'Failed to delete drug');
          }
        },
        error: (err) => {
          console.error('Delete error:', err);
          alert('Failed to delete drug. Please try again.');
        }
      });
    }
  }

  // Multi-select helper methods
  isSelected(selectedIds: string[], id: string): boolean {
    return selectedIds.includes(id);
  }

  removeTag(selectedIds: string[], id: string): void {
    const index = selectedIds.indexOf(id);
    if (index > -1) {
      selectedIds.splice(index, 1);
    }
  }

  // Helper methods to get name by ID (for tags display)
  getStrengthName(id: string): string {
    const item = this.drugStrengths.find(s => s.id === id);
    return item ? item.name : 'Unknown';
  }

  getDoseName(id: string): string {
    const item = this.drugDoses.find(d => d.id === id);
    return item ? item.name : 'Unknown';
  }

  getDurationName(id: string): string {
    const item = this.drugDurations.find(d => d.id === id);
    return item ? item.name : 'Unknown';
  }

  // Helper methods to get names from IDs for display in list view
  getDrugTypeName(id: string): string {
    const type = this.drugTypes.find(t => t.id === id);
    return type ? type.name : 'N/A';
  }

  getDrugStrengthNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'N/A';
    return ids.map(id => {
      const strength = this.drugStrengths.find(s => s.id === id);
      return strength ? strength.name : '';
    }).filter(n => n).join(', ');
  }

  getDrugDoseNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'N/A';
    return ids.map(id => {
      const dose = this.drugDoses.find(d => d.id === id);
      return dose ? dose.name : '';
    }).filter(n => n).join(', ');
  }

  getDrugDurationNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'N/A';
    return ids.map(id => {
      const duration = this.drugDurations.find(d => d.id === id);
      return duration ? duration.name : '';
    }).filter(n => n).join(', ');
  }
}