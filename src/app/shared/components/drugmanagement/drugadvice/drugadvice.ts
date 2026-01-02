import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';

// Updated interface to match API response
interface DrugAdvice {
  drugAdviceId: string;
  advice: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Updated response interface to match backend PagedResponse
interface DrugAdviceResponse {
  dataList: DrugAdvice[];
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
  selector: 'app-drug-advice',
  standalone: false,
  templateUrl: 'drugadvice.html',
  styleUrls: ['./drugadvice.css']
})
export class DrugAdviceComponent implements OnInit, OnDestroy {
  advices: DrugAdvice[] = [];
  filteredAdvices: DrugAdvice[] = [];
  paginatedAdvices: DrugAdvice[] = [];
  showModal = false;
  isEditMode = false;
  formData: DrugAdvice = { 
    drugAdviceId: '', 
    advice: '', 
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
    GET_ALL: '/DrugManagement/getAllDrugAdvice',
    CREATE: '/DrugManagement/createDrugAdvices',
    UPDATE: '/DrugManagement/updateDrugAdvice',
    DELETE: '/DrugManagement/deleteDrugAdvice'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugAdvices();
    
    // Setup debounced search - waits 500ms after user stops typing
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only trigger if search term actually changed
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page on new search
      this.loadDrugAdvices();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.searchSubject.complete();
  }

  loadDrugAdvices(): void {
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

    this.http.get<DrugAdviceResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          
          if (response.isSuccess) {
            this.advices = response.dataList || [];
            this.paginatedAdvices = response.dataList || [];
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
            this.filteredAdvices = response.dataList || [];
          } else {
            this.error = response.message || 'Failed to load drug advice data';
            this.advices = [];
            this.paginatedAdvices = [];
            this.filteredAdvices = [];
          }
          
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load drug advice data';
          console.error('API Error:', err);
          this.advices = [];
          this.paginatedAdvices = [];
          this.filteredAdvices = [];
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
    this.loadDrugAdvices();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDrugAdvices();
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
      drugAdviceId: '', 
      advice: '', 
      isActive: true 
    };
    this.showModal = true;
  }

  openEditModal(drugAdviceId: string): void {
    const advice = this.advices.find(a => a.drugAdviceId === drugAdviceId);
    if (advice) {
      this.isEditMode = true;
      this.formData = { ...advice };
      this.showModal = true;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = { 
      drugAdviceId: '', 
      advice: '', 
      isActive: true 
    };
    this.isEditMode = false;
  }

  saveAdvice(): void {
    if (!this.formData.advice || !this.formData.advice.trim()) {
      alert('Please enter advice text');
      return;
    }

    if (this.isEditMode) {
      // Update existing advice via API
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}`;
      
      this.http.put<ApiResponse>(updateUrl, this.formData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.closeModal();
              this.loadDrugAdvices();
            } else {
              alert(response.message || 'Failed to update advice');
            }
          },
          error: (err) => {
            console.error('Update error:', err);
            alert('Failed to update advice. Please try again.');
          }
        });
    } else {
      // Create new advice via API
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
      // Don't send drugAdviceId for new records
      const createData = {
        advice: this.formData.advice,
        isActive: this.formData.isActive
      };
      
      this.http.post<ApiResponse>(createUrl, createData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.closeModal();
              this.loadDrugAdvices();
            } else {
              alert(response.message || 'Failed to create advice');
            }
          },
          error: (err) => {
            console.error('Create error:', err);
            alert('Failed to create advice. Please try again.');
          }
        });
    }
  }

  deleteAdvice(drugAdviceId: string): void {
    if (confirm('Are you sure you want to delete this advice?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}`;
      
      const advice = this.advices.find(a => a.drugAdviceId === drugAdviceId);
      if (!advice) {
        alert('Advice not found');
        return;
      }
      
      // Send the entire DrugAdvice object as the backend expects
      this.http.delete<ApiResponse>(deleteUrl, { body: advice })
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.loadDrugAdvices();
            } else {
              alert(response.message || 'Failed to delete advice');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Failed to delete advice. Please try again.');
          }
        });
    }
  }
}