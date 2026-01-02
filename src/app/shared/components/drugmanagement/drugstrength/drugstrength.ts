import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastService } from '../../../../shared/services/toast-service';
import { environment } from '../../../../../environment/environment.delvelopment';

/* ===================== INTERFACES ===================== */

interface DrugStrength {
  drugStrengthId: string;
  strength: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DrugStrengthResponse {
  dataList: DrugStrength[];
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
  selector: 'app-drug-strength',
  standalone: false,
  templateUrl: './drugstrength.html',
  styleUrls: ['./drugstrength.css'],
})
export class DrugStrengthComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  /* ===================== DATA ===================== */
  drugStrengths: DrugStrength[] = [];
  paginatedDrugStrengths: DrugStrength[] = [];

  /* ===================== UI ===================== */
  showModal = false;
  isEditMode = false;
  isLoading = false;

  formData: DrugStrength = {
    drugStrengthId: '',
    strength: '',
    isActive: true,
  };

  /* ===================== PAGINATION ===================== */
  currentPage = 1;
  entriesPerPage = 10;
  totalCount = 0;
  totalPages = 1;

  /* ===================== SEARCH ===================== */
  searchTerm = '';
  private searchSubject = new Subject<string>();

  /* ===================== API ===================== */
  private readonly API = {
    GET_ALL: '/DrugManagement/getAllDrugStrength',
    CREATE: '/DrugManagement/createDrugStrength',
    UPDATE: '/DrugManagement/updateDrugStrength',
    DELETE: '/DrugManagement/deleteDrugStrength',
  };

  /* ===================== LIFECYCLE ===================== */

  ngOnInit(): void {
    this.loadDrugStrengths();

    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadDrugStrengths();
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /* ===================== LOAD ===================== */

  loadDrugStrengths(): void {
    this.isLoading = true;

    let params = new HttpParams()
      .set('page', this.currentPage)
      .set('pageSize', this.entriesPerPage);

    if (this.searchTerm?.trim()) {
      params = params.set('searchTerm', this.searchTerm.trim());
    }

    const url = `${environment.baseUrl}${this.API.GET_ALL}`;

    this.http.get<DrugStrengthResponse>(url, { params }).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to load drug strengths');
          this.resetData();
          return;
        }

        this.drugStrengths = res.dataList ?? [];
        this.paginatedDrugStrengths = this.drugStrengths;
        this.totalCount = res.totalCount ?? 0;
        this.totalPages =
          res.totalPages ??
          Math.max(1, Math.ceil(this.totalCount / this.entriesPerPage));

        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load drug strengths');
        this.resetData();
      },
    });
  }

  resetData() {
    this.drugStrengths = [];
    this.paginatedDrugStrengths = [];
    this.totalCount = 0;
    this.totalPages = 1;
    this.isLoading = false;
  }

  /* ===================== SEARCH ===================== */

  onSearch(): void {
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
    this.formData = { drugStrengthId: '', strength: '', isActive: true };
    this.showModal = true;
  }

  openEditModal(id: string): void {
    const item = this.drugStrengths.find(
      (x) => x.drugStrengthId === id
    );
    if (!item) return;

    this.isEditMode = true;
    this.formData = { ...item };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.formData = { drugStrengthId: '', strength: '', isActive: true };
  }

  /* ===================== SAVE ===================== */

  saveDrugStrength(): void {
    if (!this.formData.strength?.trim()) {
      this.toast.error('Please enter strength');
      return;
    }

    this.isEditMode ? this.update() : this.create();
  }

  create(): void {
    const url = `${environment.baseUrl}${this.API.CREATE}`;
    const payload = {
      strength: this.formData.strength,
      isActive: this.formData.isActive,
    };

    this.http.post<ApiResponse>(url, payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to create drug strength');
          return;
        }

        this.toast.success(res?.message || 'Drug strength created');
        this.afterSave();
      },
      error: () => this.toast.error('Failed to create drug strength'),
    });
  }

  update(): void {
    const url = `${environment.baseUrl}${this.API.UPDATE}/${this.formData.drugStrengthId}`;
    const payload = {
      strength: this.formData.strength,
      isActive: this.formData.isActive,
    };

    this.http.put<ApiResponse>(url, payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to update drug strength');
          return;
        }

        this.toast.success(res?.message || 'Drug strength updated');
        this.afterSave();
      },
      error: () => this.toast.error('Failed to update drug strength'),
    });
  }

  afterSave(): void {
    this.closeModal();
    this.loadDrugStrengths();
  }

  /* ===================== DELETE ===================== */

  deleteDrugStrength(id: string): void {
    if (!confirm('Are you sure you want to delete this drug strength?')) return;

    const url = `${environment.baseUrl}${this.API.DELETE}/${id}`;

    this.http.delete<ApiResponse>(url).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to delete drug strength');
          return;
        }

        this.toast.success(res?.message || 'Drug strength deleted');
        this.loadDrugStrengths();
      },
      error: () => this.toast.error('Failed to delete drug strength'),
    });
  }
}
