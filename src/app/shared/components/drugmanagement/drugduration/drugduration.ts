import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';

// Updated interface to match API response
interface DrugDuration {
  drugDurationId: string;
  duration: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Updated response interface to match backend PagedResponse
interface DrugDurationResponse {
  dataList: DrugDuration[];
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
  selector: 'app-drug-duration',
  standalone: false,
  templateUrl: './drugduration.html',
  styleUrls: ['./drugduration.css']
})
export class DrugDurationComponent implements OnInit, OnDestroy {
  // All drug durations from backend (master list)
  allDrugDurations: DrugDuration[] = [];
  
  // Filtered list based on search
  filteredDrugDurations: DrugDuration[] = [];
  
  // Paginated list for current page
  paginatedDrugDurations: DrugDuration[] = [];
  
  // UI controls
  showModal = false;
  isEditMode = false;
  formData: DrugDuration = { 
    drugDurationId: '', 
    duration: '', 
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

  // API Endpoints
  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/getAllDrugDuration',
    CREATE: '/DrugManagement/createDrugDuration',
    UPDATE: '/DrugManagement/updateDrugDuration',
    DELETE: '/DrugManagement/deleteDrugDuration'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAllDrugDurations();
    
    // Setup debounced search - waits 500ms after user stops typing
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only trigger if search term actually changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.applyFiltersAndPagination();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.searchSubject.complete();
  }

  // Load all drug durations from backend (without pagination)
  loadAllDrugDurations(): void {
    this.isLoading = true;
    this.error = '';

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;

    // Load all data without pagination parameters
    this.http.get<DrugDurationResponse>(apiUrl, { 
      params: { page: '1', pageSize: '10000' } // Large page size to get all records
    }).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        if (response.isSuccess) {
          this.allDrugDurations = response.dataList || [];
          this.applyFiltersAndPagination();
        } else {
          this.error = response.message || 'Failed to load drug duration data';
          this.allDrugDurations = [];
          this.filteredDrugDurations = [];
          this.paginatedDrugDurations = [];
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load drug duration data';
        console.error('API Error:', err);
        this.allDrugDurations = [];
        this.filteredDrugDurations = [];
        this.paginatedDrugDurations = [];
        this.isLoading = false;
      }
    });
  }

  // Apply search filter and pagination on frontend
  applyFiltersAndPagination(): void {
    // Start with all drug durations
    let filtered = [...this.allDrugDurations];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(duration => 
        duration.duration.toLowerCase().includes(search) ||
        duration.drugDurationId.toLowerCase().includes(search)
      );
    }

    // Update filtered list and total count
    this.filteredDrugDurations = filtered;
    this.totalCount = filtered.length;

    // Calculate total pages
    this.totalPages = Math.ceil(this.totalCount / this.entriesPerPage);

    // Reset to page 1 if current page exceeds total pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    this.paginatedDrugDurations = filtered.slice(startIndex, endIndex);
  }

  // Updated search method - now uses debouncing
  onSearch(): void {
    // Push the search term to the subject - debouncing will handle the delay
    this.searchSubject.next(this.searchTerm);
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
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
      drugDurationId: '', 
      duration: '', 
      isActive: true 
    };
    this.showModal = true;
  }

  openEditModal(drugDurationId: string): void {
    const drugDuration = this.allDrugDurations.find(dd => dd.drugDurationId === drugDurationId);
    if (drugDuration) {
      this.isEditMode = true;
      this.formData = { ...drugDuration };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { 
      drugDurationId: '', 
      duration: '', 
      isActive: true 
    };
    this.isEditMode = false;
  }

  saveDrugDuration(): void {
    if (!this.formData.duration || !this.formData.duration.trim()) {
      alert('Please enter duration');
      return;
    }

    if (this.isEditMode) {
      // Update existing drug duration via API - id in URL path
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}/${this.formData.drugDurationId}`;
      
      // Prepare update data without drugDurationId (it's in the URL)
      const updateData = {
        duration: this.formData.duration,
        isActive: this.formData.isActive
      };
      
      this.http.put<ApiResponse>(updateUrl, updateData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Update success:', response.message);
              this.closeModal();
              this.loadAllDrugDurations();
            } else {
              alert(response.message || 'Failed to update drug duration');
            }
          },
          error: (err) => {
            console.error('Update error:', err);
            alert('Failed to update drug duration. Please try again.');
          }
        });
    } else {
      // Create new drug duration via API
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
      // Don't send drugDurationId for new records
      const createData = {
        duration: this.formData.duration,
        isActive: this.formData.isActive
      };
      
      this.http.post<ApiResponse>(createUrl, createData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Create success:', response.message);
              this.closeModal();
              this.loadAllDrugDurations();
            } else {
              alert(response.message || 'Failed to create drug duration');
            }
          },
          error: (err) => {
            console.error('Create error:', err);
            alert('Failed to create drug duration. Please try again.');
          }
        });
    }
  }

  deleteDrugDuration(drugDurationId: string): void {
    if (confirm('Are you sure you want to delete this drug duration?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}/${drugDurationId}`;
      
      this.http.delete<ApiResponse>(deleteUrl)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Delete success:', response.message);
              this.loadAllDrugDurations();
            } else {
              alert(response.message || 'Failed to delete drug duration');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Failed to delete drug duration. Please try again.');
          }
        });
    }
  }
}