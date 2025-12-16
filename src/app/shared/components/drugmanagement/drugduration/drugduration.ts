import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
export class DrugDurationComponent implements OnInit {
  drugDurations: DrugDuration[] = [];
  filteredDrugDurations: DrugDuration[] = [];
  paginatedDrugDurations: DrugDuration[] = [];
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

  // API Endpoints
  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/getAllDrugDuration',
    CREATE: '/DrugManagement/createDrugDuration',
    UPDATE: '/DrugManagement/updateDrugDuration',
    DELETE: '/DrugManagement/deleteDrugDuration'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugDurations();
  }

  loadDrugDurations(): void {
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

    this.http.get<DrugDurationResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);
          
          if (response.isSuccess) {
            this.drugDurations = response.dataList || [];
            this.paginatedDrugDurations = response.dataList || [];
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
            this.filteredDrugDurations = response.dataList || [];
          } else {
            this.error = response.message || 'Failed to load drug duration data';
            this.drugDurations = [];
            this.paginatedDrugDurations = [];
            this.filteredDrugDurations = [];
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load drug duration data';
          console.error('API Error:', err);
          this.drugDurations = [];
          this.paginatedDrugDurations = [];
          this.filteredDrugDurations = [];
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    // Reset to page 1 when searching
    this.currentPage = 1;
    // Server-side search through API
    this.loadDrugDurations();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugDurations();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugDurations();
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
    const drugDuration = this.drugDurations.find(dd => dd.drugDurationId === drugDurationId);
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
              this.loadDrugDurations();
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
              this.loadDrugDurations();
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
              this.loadDrugDurations();
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