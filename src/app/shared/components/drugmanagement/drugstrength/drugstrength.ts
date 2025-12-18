import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';

// Updated interface to match API response
interface DrugStrength {
  drugStrengthId: string;
  strength: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Updated response interface to match backend PagedResponse
interface DrugStrengthResponse {
  dataList: DrugStrength[];
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
  selector: 'app-drug-strength',
  standalone: false,
  templateUrl: './drugstrength.html',
  styleUrls: ['./drugstrength.css']
})
export class DrugStrengthComponent implements OnInit, OnDestroy {
  drugStrengths: DrugStrength[] = [];
  filteredDrugStrengths: DrugStrength[] = [];
  paginatedDrugStrengths: DrugStrength[] = [];
  showModal = false;
  isEditMode = false;
  formData: DrugStrength = { 
    drugStrengthId: '', 
    strength: '', 
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
    GET_ALL: '/DrugManagement/getAllDrugStrength',
    CREATE: '/DrugManagement/createDrugStrength',
    UPDATE: '/DrugManagement/updateDrugStrength',
    DELETE: '/DrugManagement/deleteDrugStrength'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugStrengths();
    
    // Setup debounced search - waits 500ms after user stops typing
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only trigger if search term actually changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadDrugStrengths();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.searchSubject.complete();
  }

  loadDrugStrengths(): void {
    this.isLoading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

    // Add search term if it exists
    if (this.searchTerm && this.searchTerm.trim()) {
      params = params.set('searchTerm', this.searchTerm.trim());
    }

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;

    this.http.get<DrugStrengthResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          
          if (response.isSuccess) {
            this.drugStrengths = response.dataList || [];
            this.paginatedDrugStrengths = response.dataList || [];
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
            this.filteredDrugStrengths = response.dataList || [];
          } else {
            this.error = response.message || 'Failed to load drug strength data';
            this.drugStrengths = [];
            this.paginatedDrugStrengths = [];
            this.filteredDrugStrengths = [];
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load drug strength data';
          console.error('API Error:', err);
          this.drugStrengths = [];
          this.paginatedDrugStrengths = [];
          this.filteredDrugStrengths = [];
          this.isLoading = false;
        }
      });
  }

  // Updated search method - now uses debouncing
  onSearch(): void {
    // Push the search term to the subject - debouncing will handle the delay
    this.searchSubject.next(this.searchTerm);
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugStrengths();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugStrengths();
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
      drugStrengthId: '', 
      strength: '', 
      isActive: true 
    };
    this.showModal = true;
  }

  openEditModal(drugStrengthId: string): void {
    const drugStrength = this.drugStrengths.find(ds => ds.drugStrengthId === drugStrengthId);
    if (drugStrength) {
      this.isEditMode = true;
      this.formData = { ...drugStrength };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { 
      drugStrengthId: '', 
      strength: '', 
      isActive: true 
    };
    this.isEditMode = false;
  }

  saveDrugStrength(): void {
    if (!this.formData.strength || !this.formData.strength.trim()) {
      alert('Please enter strength');
      return;
    }

    if (this.isEditMode) {
      // Update existing drug strength via API - id in URL path
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}/${this.formData.drugStrengthId}`;
      
      // Prepare update data without drugStrengthId (it's in the URL)
      const updateData = {
        strength: this.formData.strength,
        isActive: this.formData.isActive
      };
      
      this.http.put<ApiResponse>(updateUrl, updateData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Update success:', response.message);
              this.closeModal();
              this.loadDrugStrengths();
            } else {
              alert(response.message || 'Failed to update drug strength');
            }
          },
          error: (err) => {
            console.error('Update error:', err);
            alert('Failed to update drug strength. Please try again.');
          }
        });
    } else {
      // Create new drug strength via API
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
      // Don't send drugStrengthId for new records
      const createData = {
        strength: this.formData.strength,
        isActive: this.formData.isActive
      };
      
      this.http.post<ApiResponse>(createUrl, createData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Create success:', response.message);
              this.closeModal();
              this.loadDrugStrengths();
            } else {
              alert(response.message || 'Failed to create drug strength');
            }
          },
          error: (err) => {
            console.error('Create error:', err);
            alert('Failed to create drug strength. Please try again.');
          }
        });
    }
  }

  deleteDrugStrength(drugStrengthId: string): void {
    if (confirm('Are you sure you want to delete this drug strength?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}/${drugStrengthId}`;
      
      this.http.delete<ApiResponse>(deleteUrl)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              console.log('Delete success:', response.message);
              this.loadDrugStrengths();
            } else {
              alert(response.message || 'Failed to delete drug strength');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Failed to delete drug strength. Please try again.');
          }
        });
    }
  }
}