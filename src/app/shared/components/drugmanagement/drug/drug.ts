import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';

// Dropdown interface
interface DropdownDto {
  id: string;
  name: string;
}

// API Response Variation (from backend)
interface ApiDrugVariation {
  drugVariationId?: string;
  drugTypeId: string;
  strengths?: string[];
  doses?: string[];
  durations?: string[];
  variationNote?: string;
  isActive?: boolean;
}

// Form Variation (for UI - stores TEXT for display)
interface FormDrugVariation {
  drugVariationId?: string;
  drugTypeId: string;
  strengths: string[];
  doses: string[];
  durations: string[];
  advice?: string;
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
  warning?: string;
  note?: string;
  sideEffect?: string;
  additionalAdvice?: string;
  isActive: boolean;
  variations: ApiDrugVariation[];
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
  variations: FormDrugVariation[];
}

// Backend DTO interfaces
interface DrugVariationCreateDto {
  drugTypeId: string;
  drugStrengthIds: string[];
  doseIds: string[];
  drugDurationIds: string[];
  drugAdviceId: string;
  variationNote?: string;
}

interface DrugCreateDto {
  tradeName: string;
  genericName: string;
  warning?: string;
  note?: string;
  sideEffect?: string;
  additionalAdvice?: string;
  createdBy: string;
  variations: DrugVariationCreateDto[];
}

interface DrugUpdateDto {
  drugId: string;
  tradeName: string;
  genericName: string;
  warning?: string;
  note?: string;
  sideEffect?: string;
  additionalAdvice?: string;
  isActive: boolean;
  updatedBy: string;
  variations: DrugVariationCreateDto[];
}

@Component({
  selector: 'app-drug',
  standalone: false,
  templateUrl: './drug.html',
  styleUrls: ['./drug.css']
})
export class DrugComponent implements OnInit, OnDestroy {
  // Drugs from backend (current page)
  allDrugs: Drug[] = [];
  
  // Filtered list based on type filter (client-side)
  filteredDrugList: Drug[] = [];
  
  // Paginated list for current page
  paginatedDrugList: Drug[] = [];
  
  // UI controls
  entriesPerPage: number = 10;
  searchTerm: string = '';
  selectedFilterType: string = '';
  showCreateForm: boolean = false;
  isEditMode: boolean = false;
  editingDrugId: string | null = null;
  isLoading = false;
  error = '';

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // Debounce search - Industry Standard
  private searchSubject = new Subject<string>();

  // Dropdowns
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
    this.loadAllDrugs();
    
    // Setup debounced search - waits 500ms after user stops typing
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only trigger if search term actually changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadAllDrugs();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.searchSubject.complete();
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
      next: (response) => { this.drugTypes = response || []; },
      error: (err) => { console.error('Error loading drug types:', err); this.drugTypes = []; }
    });
  }

  loadDrugStrengths(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_STRENGTH}`;
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => { this.drugStrengths = response || []; },
      error: (err) => { console.error('Error loading drug strengths:', err); this.drugStrengths = []; }
    });
  }

  loadDrugDoses(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_DOSE}`;
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => { this.drugDoses = response || []; },
      error: (err) => { console.error('Error loading drug doses:', err); this.drugDoses = []; }
    });
  }

  loadDrugDurations(): void {
    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DROPDOWN_DURATION}`;
    this.http.get<DropdownDto[]>(apiUrl).subscribe({
      next: (response) => { this.drugDurations = response || []; },
      error: (err) => { console.error('Error loading drug durations:', err); this.drugDurations = []; }
    });
  }

  // Load drugs with backend pagination and search
  loadAllDrugs(): void {
    this.isLoading = true;
    this.error = '';

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;
    
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

    // Add search term if it exists
    if (this.searchTerm && this.searchTerm.trim()) {
      params = params.set('search', this.searchTerm.trim());
    }

    this.http.get<DrugResponse>(apiUrl, { params }).subscribe({
      next: (response) => {
        
        if (response.isSuccess) {
          this.allDrugs = response.dataList || [];
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.applyClientSideFilter();
        } else {
          this.error = response.message || 'Failed to load drug data';
          this.allDrugs = [];
          this.filteredDrugList = [];
          this.paginatedDrugList = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load drug data';
        console.error('API Error:', err);
        this.allDrugs = [];
        this.filteredDrugList = [];
        this.paginatedDrugList = [];
        this.isLoading = false;
      }
    });
  }

  // Apply client-side type filter only (search is on backend)
  applyClientSideFilter(): void {
    let filtered = [...this.allDrugs];

    // Apply type filter on client side
    if (this.selectedFilterType) {
      filtered = filtered.filter(drug =>
        drug.variations.some(v => v.drugTypeId === this.selectedFilterType)
      );
    }

    this.filteredDrugList = filtered;
    this.paginatedDrugList = filtered;
  }

  // Updated search method - now uses debouncing with backend API
  onSearch(): void {
    // Push the search term to the subject - debouncing will handle the delay
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.applyClientSideFilter();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadAllDrugs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAllDrugs();
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
    const effectiveCount = this.selectedFilterType ? this.filteredDrugList.length : this.totalCount;
    return Math.min(this.getStartIndex() + this.paginatedDrugList.length - 1, effectiveCount);
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
    const drug = this.allDrugs.find(d => d.drugId === drugId);
    if (drug) {
      this.isEditMode = true;
      this.editingDrugId = drugId;
      
      const formVariations: FormDrugVariation[] = drug.variations.map(v => ({
        drugVariationId: v.drugVariationId,
        drugTypeId: v.drugTypeId,
        strengths: v.strengths || [],
        doses: v.doses || [],
        durations: v.durations || [],
        advice: v.variationNote || '',
        strengthSearch: '',
        doseSearch: '',
        durationSearch: '',
        showStrengthDropdown: false,
        showDoseDropdown: false,
        showDurationDropdown: false,
        filteredStrengths: [],
        filteredDoses: [],
        filteredDurations: []
      }));
      
      this.formData = {
        tradeName: drug.tradeName || '',
        genericName: drug.genericName || '',
        warning: drug.warning ?? '',
        note: drug.note ?? '',
        sideEffect: drug.sideEffect ?? '',
        additionalAdvice: drug.additionalAdvice ?? '',
        isActive: drug.isActive ?? true,
        variations: formVariations
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
      strengths: [],
      doses: [],
      durations: [],
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

  // Searchable dropdown methods
  filterStrengths(index: number): void {
    const variation = this.formData.variations[index];
    const searchTerm = (variation.strengthSearch || '').toLowerCase().trim();
    
    if (searchTerm) {
      variation.filteredStrengths = this.drugStrengths.filter(s => 
        s.name.toLowerCase().includes(searchTerm) && 
        !variation.strengths.includes(s.name)
      );
      variation.showStrengthDropdown = variation.filteredStrengths.length > 0;
    } else {
      variation.filteredStrengths = [];
      variation.showStrengthDropdown = false;
    }
  }

  getFilteredStrengths(index: number): DropdownDto[] {
    return this.formData.variations[index].filteredStrengths || [];
  }

  showStrengthDropdown(index: number): void {
    const variation = this.formData.variations[index];
    if (variation.strengthSearch && variation.strengthSearch.trim()) {
      this.filterStrengths(index);
    } else {
      variation.showStrengthDropdown = false;
    }
  }

  hideStrengthDropdown(index: number): void {
    setTimeout(() => {
      this.formData.variations[index].showStrengthDropdown = false;
    }, 200);
  }

  selectStrength(index: number, strengthName: string): void {
    const variation = this.formData.variations[index];
    if (!variation.strengths.includes(strengthName)) {
      variation.strengths.push(strengthName);
    }
    variation.strengthSearch = '';
    variation.showStrengthDropdown = false;
  }

  onStrengthKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const variation = this.formData.variations[index];
      const value = variation.strengthSearch?.trim();
      
      if (value && !variation.strengths.includes(value)) {
        variation.strengths.push(value);
        variation.strengthSearch = '';
        variation.showStrengthDropdown = false;
      }
    }
  }

  filterDoses(index: number): void {
    const variation = this.formData.variations[index];
    const searchTerm = (variation.doseSearch || '').toLowerCase().trim();
    
    if (searchTerm) {
      variation.filteredDoses = this.drugDoses.filter(d => 
        d.name.toLowerCase().includes(searchTerm) && 
        !variation.doses.includes(d.name)
      );
      variation.showDoseDropdown = variation.filteredDoses.length > 0;
    } else {
      variation.filteredDoses = [];
      variation.showDoseDropdown = false;
    }
  }

  getFilteredDoses(index: number): DropdownDto[] {
    return this.formData.variations[index].filteredDoses || [];
  }

  showDoseDropdown(index: number): void {
    const variation = this.formData.variations[index];
    if (variation.doseSearch && variation.doseSearch.trim()) {
      this.filterDoses(index);
    } else {
      variation.showDoseDropdown = false;
    }
  }

  hideDoseDropdown(index: number): void {
    setTimeout(() => {
      this.formData.variations[index].showDoseDropdown = false;
    }, 200);
  }

  selectDose(index: number, doseName: string): void {
    const variation = this.formData.variations[index];
    if (!variation.doses.includes(doseName)) {
      variation.doses.push(doseName);
    }
    variation.doseSearch = '';
    variation.showDoseDropdown = false;
  }

  onDoseKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const variation = this.formData.variations[index];
      const value = variation.doseSearch?.trim();
      
      if (value && !variation.doses.includes(value)) {
        variation.doses.push(value);
        variation.doseSearch = '';
        variation.showDoseDropdown = false;
      }
    }
  }

  filterDurations(index: number): void {
    const variation = this.formData.variations[index];
    const searchTerm = (variation.durationSearch || '').toLowerCase().trim();
    
    if (searchTerm) {
      variation.filteredDurations = this.drugDurations.filter(d => 
        d.name.toLowerCase().includes(searchTerm) && 
        !variation.durations.includes(d.name)
      );
      variation.showDurationDropdown = variation.filteredDurations.length > 0;
    } else {
      variation.filteredDurations = [];
      variation.showDurationDropdown = false;
    }
  }

  getFilteredDurations(index: number): DropdownDto[] {
    return this.formData.variations[index].filteredDurations || [];
  }

  showDurationDropdown(index: number): void {
    const variation = this.formData.variations[index];
    if (variation.durationSearch && variation.durationSearch.trim()) {
      this.filterDurations(index);
    } else {
      variation.showDurationDropdown = false;
    }
  }

  hideDurationDropdown(index: number): void {
    setTimeout(() => {
      this.formData.variations[index].showDurationDropdown = false;
    }, 200);
  }

  selectDuration(index: number, durationName: string): void {
    const variation = this.formData.variations[index];
    if (!variation.durations.includes(durationName)) {
      variation.durations.push(durationName);
    }
    variation.durationSearch = '';
    variation.showDurationDropdown = false;
  }

  onDurationKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const variation = this.formData.variations[index];
      const value = variation.durationSearch?.trim();
      
      if (value && !variation.durations.includes(value)) {
        variation.durations.push(value);
        variation.durationSearch = '';
        variation.showDurationDropdown = false;
      }
    }
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

    for (let i = 0; i < this.formData.variations.length; i++) {
      const variation = this.formData.variations[i];
      if (!variation.drugTypeId) {
        alert(`Please select a drug type for variation ${i + 1}`);
        return;
      }
    }

    const transformedVariations: DrugVariationCreateDto[] = this.formData.variations.map(v => ({
      drugTypeId: v.drugTypeId,
      drugStrengthIds: v.strengths.length > 0 ? v.strengths : [],
      doseIds: v.doses.length > 0 ? v.doses : [],
      drugDurationIds: v.durations.length > 0 ? v.durations : [],
      drugAdviceId: '00000000-0000-0000-0000-000000000000',
      variationNote: v.advice || ''
    }));

    if (this.isEditMode && this.editingDrugId) {
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}`;
      
      const updateData: DrugUpdateDto = {
        drugId: this.editingDrugId,
        tradeName: this.formData.tradeName.trim(),
        genericName: this.formData.genericName.trim(),
        warning: this.formData.warning?.trim() || '',
        note: this.formData.note?.trim() || '',
        sideEffect: this.formData.sideEffect?.trim() || '',
        additionalAdvice: this.formData.additionalAdvice?.trim() || '',
        isActive: this.formData.isActive,
        updatedBy: this.getCurrentUserId(),
        variations: transformedVariations
      };
      
      this.http.put<ApiResponse>(updateUrl, updateData).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            alert('Drug updated successfully!');
            this.closeForm();
            this.loadAllDrugs();
          } else {
            alert(response.message || 'Failed to update drug');
          }
        },
        error: (err) => {
          console.error('Update error:', err);
          alert(err.error?.message || err.error?.title || 'Failed to update drug. Please try again.');
        }
      });
    } else {
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
      const createData: DrugCreateDto = {
        tradeName: this.formData.tradeName.trim(),
        genericName: this.formData.genericName.trim(),
        warning: this.formData.warning?.trim() || '',
        note: this.formData.note?.trim() || '',
        sideEffect: this.formData.sideEffect?.trim() || '',
        additionalAdvice: this.formData.additionalAdvice?.trim() || '',
        createdBy: this.getCurrentUserId(),
        variations: transformedVariations
      };
      
      this.http.post<ApiResponse>(createUrl, createData).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            alert('Drug created successfully!');
            this.closeForm();
            this.loadAllDrugs();
          } else {
            alert(response.message || 'Failed to create drug');
          }
        },
        error: (err) => {
          console.error('Create error:', err);
          alert(err.error?.message || err.error?.title || 'Failed to create drug. Please try again.');
        }
      });
    }
  }

  private getCurrentUserId(): string {
    return '00000000-0000-0000-0000-000000000000';
  }

  deleteDrug(drugId: string): void {
    if (confirm('Are you sure you want to delete this drug?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}/${drugId}`;
      
      this.http.delete<ApiResponse>(deleteUrl).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            alert('Drug deleted successfully!');
            this.loadAllDrugs();
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

  removeTag(selectedTexts: string[], text: string): void {
    const index = selectedTexts.indexOf(text);
    if (index > -1) {
      selectedTexts.splice(index, 1);
    }
  }

  getDrugTypeName(id: string): string {
    const type = this.drugTypes.find(t => t.id === id);
    return type ? type.name : 'N/A';
  }
}