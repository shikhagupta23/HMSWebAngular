import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastService } from '../../../../shared/services/toast-service';
import { environment } from '../../../../../environment/environment.delvelopment';

/* ===================== INTERFACES ===================== */

interface DrugDuration {
  drugDurationId: string;
  duration: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DrugDurationResponse {
  dataList: DrugDuration[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isSuccess: boolean;
  message: string;
}

interface ApiResponse {
  isSuccess: boolean;
  message: string;
  id?: string;
}

/* ===================== COMPONENT ===================== */

@Component({
  selector: 'app-drug-duration',
  standalone: false,
  templateUrl: './drugduration.html',
  styleUrls: ['./drugduration.css'],
})
export class DrugDurationComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  /* ===================== DATA ===================== */
  allDrugDurations: DrugDuration[] = [];
  filteredDrugDurations: DrugDuration[] = [];
  paginatedDrugDurations: DrugDuration[] = [];

  /* ===================== UI ===================== */
  showModal = false;
  isEditMode = false;
  isLoading = false;

  formData: DrugDuration = {
    drugDurationId: '',
    duration: '',
    isActive: true,
  };

  /* ===================== PAGINATION ===================== */
  entriesPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;

  /* ===================== SEARCH ===================== */
  searchTerm = '';
  error = '';
  // Debounce search - Industry Standard
  private searchSubject = new Subject<string>();

  /* ===================== API ===================== */
  private readonly API = {
    GET_ALL: '/DrugManagement/getAllDrugDuration',
    CREATE: '/DrugManagement/createDrugDuration',
    UPDATE: '/DrugManagement/updateDrugDuration',
    DELETE: '/DrugManagement/deleteDrugDuration',
  };

  /* ===================== LIFECYCLE ===================== */

  ngOnInit(): void {
    this.loadAllDrugDurations();

    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.applyFiltersAndPagination();
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /* ===================== LOAD ===================== */

  loadAllDrugDurations(): void {
    this.isLoading = true;
    this.error = '';

    const url = `${environment.baseUrl}${this.API.GET_ALL}`;

    this.http
      .get<DrugDurationResponse>(url, {
        params: { page: '1', pageSize: '10000' },
      })
      .subscribe({
        next: (res) => {
          if (!res?.isSuccess) {
            this.toast.error(res?.message || 'Failed to load drug durations');
            this.resetData();
            return;
          }

          this.allDrugDurations = res.dataList ?? [];
          this.applyFiltersAndPagination();
          this.isLoading = false;
        },
        error: () => {
          this.toast.error('Failed to load drug durations');
          this.resetData();
        },
      });
  }

  resetData() {
    this.allDrugDurations = [];
    this.filteredDrugDurations = [];
    this.paginatedDrugDurations = [];
    this.isLoading = false;
  }

  /* ===================== FILTER + PAGINATION ===================== */

  applyFiltersAndPagination(): void {
    let filtered = [...this.allDrugDurations];

    if (this.searchTerm?.trim()) {
      const s = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (x) =>
          x.duration.toLowerCase().includes(s) ||
          x.drugDurationId.toLowerCase().includes(s)
      );
    }

    this.filteredDrugDurations = filtered;
    this.totalCount = filtered.length;
    this.totalPages = Math.max(
      1,
      Math.ceil(this.totalCount / this.entriesPerPage)
    );

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.entriesPerPage;
    const end = start + this.entriesPerPage;

    this.paginatedDrugDurations = filtered.slice(start, end);
  }

  onSearch(): void {
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
    this.formData = { drugDurationId: '', duration: '', isActive: true };
    this.showModal = true;
  }

  openEditModal(id: string): void {
    const item = this.allDrugDurations.find((x) => x.drugDurationId === id);
    if (!item) return;

    this.isEditMode = true;
    this.formData = { ...item };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.formData = { drugDurationId: '', duration: '', isActive: true };
  }

  /* ===================== SAVE ===================== */

  saveDrugDuration(): void {
    if (!this.formData.duration?.trim()) {
      this.toast.error('Please enter duration');
      return;
    }

    this.isEditMode ? this.update() : this.create();
  }

  create() {
    const url = `${environment.baseUrl}${this.API.CREATE}`;
    const payload = {
      duration: this.formData.duration,
      isActive: this.formData.isActive,
    };

    this.http.post<ApiResponse>(url, payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to create drug duration');
          return;
        }

        this.toast.success(res?.message || 'Drug duration created');
        this.afterSave();
      },
      error: () => this.toast.error('Failed to create drug duration'),
    });
  }

  update() {
    const url = `${environment.baseUrl}${this.API.UPDATE}/${this.formData.drugDurationId}`;
    const payload = {
      duration: this.formData.duration,
      isActive: this.formData.isActive,
    };

    this.http.put<ApiResponse>(url, payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to update drug duration');
          return;
        }

        this.toast.success(res?.message || 'Drug duration updated');
        this.afterSave();
      },
      error: () => this.toast.error('Failed to update drug duration'),
    });
  }

  afterSave() {
    this.closeModal();
    this.loadAllDrugDurations();
  }

  /* ===================== DELETE ===================== */

  deleteDrugDuration(id: string): void {
    if (!confirm('Are you sure you want to delete this drug duration?')) return;

    const url = `${environment.baseUrl}${this.API.DELETE}/${id}`;

    this.http.delete<ApiResponse>(url).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to delete drug duration');
          return;
        }

        this.toast.success(res?.message || 'Drug duration deleted');
        this.loadAllDrugDurations();
      },
      error: () => this.toast.error('Failed to delete drug duration'),
    });
  }
}
