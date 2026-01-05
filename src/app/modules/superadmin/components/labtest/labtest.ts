import { Component, ElementRef, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastService } from '../../../../shared/services/toast-service';
import { Labtest } from '../../services/labtest';

interface LabTest {
  id: string;
  testName: string;
  category: string;
  price: number;
  description?: string;
  createdAt?: Date;
}

@Component({
  selector: 'app-labtest',
  standalone: false,
  templateUrl: './labtest.html',
  styleUrls: ['./labtest.scss'],
})
export class LabtestComponent implements OnInit, OnDestroy {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;

  labTestForm!: FormGroup;

  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private labTestService = inject(Labtest);
  
  // Add Subject for search debouncing
  private searchSubject$ = new Subject<string>();

  labTests: LabTest[] = [];
  searchText: string = '';
  isEditMode: boolean = false;
  editingTestId: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.buildForm();
    this.loadLabTests();
    this.attachModalCloseHandler();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.searchSubject$.complete();
  }

  setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(200), // Wait 200ms after user stops typing
        distinctUntilChanged() // Only emit if value has changed
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadLabTests(1);
      });
  }

  get f() {
    return this.labTestForm.controls;
  }

  buildForm() {
    this.labTestForm = this.fb.group({
      testName: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
    });
  }

  attachModalCloseHandler() {
    const modalEl = document.getElementById('labTestModal');
    modalEl?.addEventListener('hidden.bs.modal', () => {
      this.labTestForm.reset();
      this.isEditMode = false;
      this.editingTestId = null;
    });
  }

  onSubmit() {
    if (this.labTestForm.invalid) return;

    const payload = this.labTestForm.value;

    if (this.isEditMode) {
      payload.id = this.editingTestId;
      this.updateTest(payload);
    } else {
      this.addNewTest(payload);
    }
  }

  addNewTest(payload: any) {
    this.labTestService.addLabTest(payload).subscribe({
      next: (res: any) => {
        if (res?.isSuccess) {
          this.toast.success(res.message);
          this.closeModal();
          this.loadLabTests(this.currentPage);
        }
      },
    });
  }

  updateTest(payload: any) {
    this.labTestService.updateLabTest(payload).subscribe({
      next: (res: any) => {
        if (res?.isSuccess) {
          this.toast.success(res.message);
          this.closeModal();
          this.loadLabTests(this.currentPage);
        }
      },
    });
  }

  editTest(test: any) {
    this.isEditMode = true;
    this.editingTestId = test.id;
    this.labTestForm.patchValue(test);
  }

  deleteTest(test: any) {
  if (confirm(`Are you sure you want to delete "${test.testName}"?`)) {
    this.labTestService.deleteLabTest(test.labTestId).subscribe({
      next: (res: any) => {
        if (res?.isSuccess) {
          this.toast.success(res.message || 'Test deleted successfully');

          if (this.labTests.length === 1 && this.currentPage > 1) {
            this.currentPage--;
            this.loadLabTests(this.currentPage);
          } else {
            this.loadLabTests(this.currentPage);
          }
        } else {
          this.toast.error(res?.message || 'Delete failed');
        }
      },
      error: (err) => {
        this.toast.error('Failed to delete test');
      }
    });
  }
}

  closeModal() {
    this.closeModalBtn.nativeElement.click();
  }

  loadLabTests(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    
    this.labTestService.getLabTests(page, this.pageSize).subscribe({
      next: (res: any) => {
        if (res) {
          this.labTests = res.dataList || [];
          
          // Apply client-side search filter if searchText exists
          if (this.searchText.trim()) {
            const searchLower = this.searchText.toLowerCase();
            this.labTests = this.labTests.filter(test => 
              test.testName.toLowerCase().includes(searchLower) ||
              test.category.toLowerCase().includes(searchLower)
            );
          }
          
          this.currentPage = res.pageNumber ?? page;
          this.pageSize = res.pageSize ?? this.pageSize;
          this.totalCount = res.totalCount ?? 0;
          this.totalPages = res.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        } else {
          this.resetTable();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load lab tests');
        this.resetTable();
        this.isLoading = false;
      },
    });
  }

  private resetTable() {
    this.labTests = [];
    this.totalCount = 0;
    this.totalPages = 1;
    this.currentPage = 1;
  }

  // Updated method - now emits to Subject instead of calling API directly
  filterTests() {
    this.searchSubject$.next(this.searchText);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadLabTests(page);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.loadLabTests(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadLabTests(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getDisplayRange(): string {
    if (this.totalCount === 0) return 'Showing 0 entries';
    
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCount);
    return `Showing ${start} to ${end} of ${this.totalCount} entries`;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadLabTests(1);
  }
}