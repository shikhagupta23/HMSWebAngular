import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
export class LabtestComponent implements OnInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;

  labTestForm!: FormGroup;

  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private labTestService = inject(Labtest);
  testName: string = '';
  category: string = '';
  price: number | null = null;
  description: string = '';

  labTests: LabTest[] = [];
  filteredLabTests: LabTest[] = [];
  searchText: string = '';
  isEditMode: boolean = false;
  editingTestId: string | null = null;
  showModal: boolean = false;

  // Pagination
  pages: number[] = [];

  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;
  Math = Math; // Add Math reference for template

  constructor() {}

  ngOnInit(): void {
    this.buildForm();
    this.loadLabTests();
    this.attachModalCloseHandler();
  }

  /** convenience getter */
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
          this.loadLabTests();
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
          this.loadLabTests();
        }
      },
    });
  }

  editTest(test: any) {
    this.isEditMode = true;
    this.editingTestId = test.id;
    this.labTestForm.patchValue(test);
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
          this.labTests = res.dataList;
          this.filteredLabTests = [...this.labTests];
          this.currentPage = res.pageNumber ?? this.currentPage;
          this.pageSize = res.pageSize ?? this.pageSize;
          this.totalCount = res.totalCount ?? this.labTests.length;
          const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
          this.totalPages = res.totalPages ?? computedPages;
          this.buildPages();
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
    this.filteredLabTests = [];
    this.totalCount = 0;
    this.totalPages = 1;
    this.pages = [];
  }
  filterTests() {
    const s = this.searchText.toLowerCase();
    this.filteredLabTests = this.labTests.filter((x) => x.testName.toLowerCase().includes(s));
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadLabTests(page);
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.loadLabTests(this.currentPage - 1);
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadLabTests(this.currentPage + 1);
    }
  }

  /**
   * Get array of page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.testName = '';
    this.category = '';
    this.price = null;
    this.description = '';
    this.isEditMode = false;
    this.editingTestId = null;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadLabTests(1);
  }
  buildPages(): void {
    this.pages = [];
    const maxPagesToShow = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);

    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      this.pages.push(i);
    }
  }
}
