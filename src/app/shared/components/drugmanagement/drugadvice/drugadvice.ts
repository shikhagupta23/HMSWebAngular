import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../../environment/environment.delvelopment';
import { ToastService } from '../../../services/toast-service';

interface DrugAdvice {
  drugAdviceId: string;
  advice: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

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

  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  private searchSubject = new Subject<string>();

  private readonly API_ENDPOINTS = {
    GET_ALL: '/DrugManagement/getAllDrugAdvice',
    CREATE: '/DrugManagement/createDrugAdvices',
    UPDATE: '/DrugManagement/updateDrugAdvice',
    DELETE: '/DrugManagement/deleteDrugAdvice'
  };

  private toast = Inject(ToastService);
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDrugAdvices();
    
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadDrugAdvices();
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  loadDrugAdvices(): void {
    this.isLoading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('pageSize', this.entriesPerPage.toString());

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

  onSearch(): void {
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
      this.toast.error('Please enter advice text');
      return;
    }

    if (this.isEditMode) {
      const updateUrl = `${environment.baseUrl}${this.API_ENDPOINTS.UPDATE}`;
      
      this.http.put<ApiResponse>(updateUrl, this.formData)
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.closeModal();
              this.loadDrugAdvices();
            } else {
              this.toast.error(response.message || 'Failed to update advice');
            }
          },
          error: (err) => {
            console.error('Update error:', err);
            this.toast.error('Failed to update advice. Please try again.');
          }
        });
    } else {
      const createUrl = `${environment.baseUrl}${this.API_ENDPOINTS.CREATE}`;
      
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
              this.toast.error(response.message || 'Failed to create advice');
            }
          },
          error: (err) => {
            console.error('Create error:', err);
            this.toast.error('Failed to create advice. Please try again.');
          }
        });
    }
  }

  deleteAdvice(drugAdviceId: string): void {
    if (confirm('Are you sure you want to delete this advice?')) {
      const deleteUrl = `${environment.baseUrl}${this.API_ENDPOINTS.DELETE}`;
      
      const advice = this.advices.find(a => a.drugAdviceId === drugAdviceId);
      if (!advice) {
        this.toast.error('Advice not found');
        return;
      }
      
      this.http.delete<ApiResponse>(deleteUrl, { body: advice })
        .subscribe({
          next: (response) => {
            if (response.isSuccess) {
              this.loadDrugAdvices();
            } else {
              this.toast.error(response.message || 'Failed to delete advice');
            }
          },
          error: (err) => {
            console.error('Delete error:', err);
            this.toast.error('Failed to delete advice. Please try again.');
          }
        });
    }
  }
}