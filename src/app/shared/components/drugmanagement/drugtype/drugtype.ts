import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';
import { ToastService } from '../../../services/toast-service';

// Updated interface to match API response
interface DrugType {
  drugTypeId: string;
  typeName: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Updated response interface to match backend PagedResponse
interface DrugTypeResponse {
  dataList: DrugType[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isSuccess: boolean;
  message: string;
  id?: string;
}

// API Response for Create/Update/Delete operations
interface ApiResponse {
  isSuccess: boolean;
  message: string;
  id?: string;
}

@Component({
  selector: 'app-drug-type',
  standalone: false,
  templateUrl: './drugtype.html',
  styleUrls: ['./drugtype.css']
})
export class DrugTypeComponent implements OnInit, OnDestroy {
  private toast= inject(ToastService);
  drugTypes: DrugType[] = [];
  filteredDrugTypes: DrugType[] = [];
  paginatedDrugTypes: DrugType[] = [];
  showModal = false;
  isEditMode = false;
  formData: DrugType = { 
    drugTypeId: '', 
    typeName: '', 
    description: '',
    isActive: true 
  };
  entriesPerPage = 10;
  searchTerm = '';
  isLoading = false;
  error = '';

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // Debounce search - Industry Standard
  private searchSubject = new Subject<string>();

  // API Endpoints - Updated to match backend routes
  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/getAllDrugType',
    CREATE: '/DrugManagement/createDrugType',
    UPDATE: '/DrugManagement/updateDrugType',
    DELETE: '/DrugManagement/deleteDrugType'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugTypes();
    
    // Setup debounced search - waits 500ms after user stops typing
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only trigger if search term actually changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadDrugTypes();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.searchSubject.complete();
  }

  loadDrugTypes(): void {
  this.isLoading = true;
  this.error = '';

  let params = new HttpParams()
    .set('page', this.currentPage.toString())
    .set('pageSize', this.entriesPerPage.toString());

  if (this.searchTerm?.trim()) {
    params = params.set('searchTerm', this.searchTerm.trim());
  }

  const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;

  this.http.get<DrugTypeResponse>(apiUrl, { params }).subscribe({
    next: (res) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Failed to load drug types');
        this.resetList();
        this.isLoading = false;
        return;
      }

      this.drugTypes = res.dataList ?? [];
      this.filteredDrugTypes = res.dataList ?? [];
      this.paginatedDrugTypes = res.dataList ?? [];
      this.totalCount = res.totalCount ?? 0;
      this.totalPages = res.totalPages ?? 1;

      this.isLoading = false;
    },
    error: () => {
      this.toast.error('Failed to load drug types');
      this.resetList();
      this.isLoading = false;
    },
  });
}

private resetList(): void {
  this.drugTypes = [];
  this.filteredDrugTypes = [];
  this.paginatedDrugTypes = [];
  this.totalCount = 0;
  this.totalPages = 1;
}


  // Updated search method - now uses debouncing
  onSearch(): void {
    // Push the search term to the subject - debouncing will handle the delay
    this.searchSubject.next(this.searchTerm);
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugTypes();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugTypes();
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

  openCreateModal(): void {
    this.isEditMode = false;
    this.formData = { 
      drugTypeId: '', 
      typeName: '', 
      description: '',
      isActive: true 
    };
    this.showModal = true;
  }

  openEditModal(drugTypeId: string): void {
    const drugType = this.drugTypes.find(dt => dt.drugTypeId === drugTypeId);
    if (drugType) {
      this.isEditMode = true;
      this.formData = { ...drugType };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { 
      drugTypeId: '', 
      typeName: '', 
      description: '',
      isActive: true 
    };
    this.isEditMode = false;
  }

  saveDrugType(): void {
  if (!this.formData.typeName?.trim()) {
    this.toast.error('Drug type name is required');
    return;
  }

  if (this.isEditMode) {
    this.updateDrugType();
  } else {
    this.createDrugType();
  }
}
private createDrugType(): void {
  const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;

  const payload = {
    typeName: this.formData.typeName,
    description: this.formData.description,
    isActive: this.formData.isActive,
  };

  this.http.post<ApiResponse>(createUrl, payload).subscribe({
    next: (res) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Failed to create drug type');
        return;
      }

      this.toast.success(res?.message || 'Drug type created successfully');
      this.closeModal();
      this.loadDrugTypes();
    },
    error: () => this.toast.error('Failed to create drug type'),
  });
}
private updateDrugType(): void {
  const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}`;

  this.http.put<ApiResponse>(updateUrl, this.formData).subscribe({
    next: (res) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Failed to update drug type');
        return;
      }

      this.toast.success(res?.message || 'Drug type updated successfully');
      this.closeModal();
      this.loadDrugTypes();
    },
    error: () => this.toast.error('Failed to update drug type'),
  });
}


 deleteDrugType(drugTypeId: string): void {
  if (!confirm('Are you sure you want to delete this drug type?')) return;

  const drugType = this.drugTypes.find(dt => dt.drugTypeId === drugTypeId);
  if (!drugType) {
    this.toast.error('Drug type not found');
    return;
  }

  const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}`;

  this.http.delete<ApiResponse>(deleteUrl, { body: drugType }).subscribe({
    next: (res) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Failed to delete drug type');
        return;
      }

      this.toast.success(res?.message || 'Drug type deleted successfully');
      this.loadDrugTypes();
    },
    error: () => this.toast.error('Failed to delete drug type'),
  });
}

}