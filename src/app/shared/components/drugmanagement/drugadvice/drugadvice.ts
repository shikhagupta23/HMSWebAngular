import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environment/environment.delvelopment';

// Updated interface to match API response
interface DrugAdvice {
  drugAdviceId: string;  // Changed from 'id: number' to match API
  advice: string;
  isActive: boolean;     // Changed from 'status: string' to match API
}

// Updated response interface
interface DrugAdviceResponse {
  dataList: DrugAdvice[];  // Changed from 'data' to 'dataList'
  totalCount: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-drug-advice',
  standalone: false,
  templateUrl: 'drugadvice.html',
  styleUrls: ['./drugadvice.css']
})
export class DrugAdviceComponent implements OnInit {
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
  entriesPerPage = 20;
  searchTerm = '';
  isLoading = false;
  error = '';

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  // API Endpoints
  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/GetAll',
    CREATE: '/api/DrugManagement',
    UPDATE: '/api/DrugManagement',
    DELETE: '/api/DrugManagement'
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugAdvices();
  }

  loadDrugAdvices(): void {
    this.isLoading = true;
    this.error = '';

    const params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

    const apiUrl = `${environment.baseUrl}${this.API_ENDPOINTS.GET_ALL}`;

    this.http.get<DrugAdviceResponse>(apiUrl, { params })
      .subscribe({
        next: (response) => {
          console.log('API Response:', response); // Debug log
          
          // Use 'dataList' instead of 'data'
          this.advices = response.dataList || [];
          this.paginatedAdvices = response.dataList || [];
          this.totalCount = response.totalCount;
          this.totalPages = Math.ceil(this.totalCount / this.entriesPerPage);
          this.filteredAdvices = response.dataList || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load drug advice data';
          console.error('API Error:', err);
          this.isLoading = false;
        }
      });
  }

  filterAdvices(): void {
    this.filteredAdvices = this.advices.filter(advice =>
      advice.advice.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.updateLocalPagination();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.filterAdvices();
  }

  onEntriesPerPageChange(): void {
    this.currentPage = 1;
    this.loadDrugAdvices();
  }

  updateLocalPagination(): void {
    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    this.paginatedAdvices = this.filteredAdvices.slice(startIndex, endIndex);
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
    return (this.currentPage - 1) * this.entriesPerPage + 1;
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
    if (this.formData.advice.trim()) {
      if (this.isEditMode) {
        // Update existing advice via API
        const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}/${this.formData.drugAdviceId}`;
        this.http.put<DrugAdvice>(updateUrl, this.formData)
          .subscribe({
            next: () => {
              this.closeModal();
              this.loadDrugAdvices();
            },
            error: (err) => {
              console.error('Update error:', err);
              alert('Failed to update advice');
            }
          });
      } else {
        // Create new advice via API
        const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
        this.http.post<DrugAdvice>(createUrl, this.formData)
          .subscribe({
            next: () => {
              this.closeModal();
              this.loadDrugAdvices();
            },
            error: (err) => {
              console.error('Create error:', err);
              alert('Failed to create advice');
            }
          });
      }
    }
  }

  deleteAdvice(drugAdviceId: string): void {
    if (confirm('Are you sure you want to delete this advice?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}/${drugAdviceId}`;
      this.http.delete(deleteUrl)
        .subscribe({
          next: () => {
            this.loadDrugAdvices();
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Failed to delete advice');
          }
        });
    }
  }
}