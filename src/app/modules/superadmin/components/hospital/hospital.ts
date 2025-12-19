import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalService } from '../../services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';

declare const bootstrap: any;

@Component({
  selector: 'app-hospital',
  standalone: false,
  templateUrl: './hospital.html',
  styleUrl: './hospital.scss',
})
export class Hospital implements OnInit, AfterViewInit {
  @ViewChild('addHospitalModal') addHospitalModal!: ElementRef;
  dataList: any[] = [];

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';

  addHospitalForm!: FormGroup;
  selectedFile?: File;

  private fb = inject(FormBuilder);
  private api = inject(HospitalService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.initForm();
    this.loadHospitals();
  }
  ngAfterViewInit() {
    const modalEl = document.getElementById('addHospitalModal');

    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.resetAddHospitalForm();
      });
    }
  }

  initForm() {
    this.addHospitalForm = this.fb.group({
      HospitalName: ['', [Validators.required, Validators.minLength(3)]],

      HospitalPhoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],

      HospitalRegistrationNumber: ['', [Validators.required, Validators.minLength(3)]],

      HospitalEmail: ['', [Validators.required, Validators.email]],

      HospitalAddress: [
        '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(250)],
      ],

      City: ['', [Validators.required, Validators.minLength(2)]],

      State: ['', [Validators.required, Validators.minLength(2)]],

      PinCode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],

      CountryCode: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}$/)]],

      HospitalImageFile: [null],
    });
  }

  loadHospitals() {
    this.api.getHospitals(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        // API returns: { dataList: [], pageNumber, pageSize, totalCount, totalPages, ... }
        if (res) {
          this.dataList =
            res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);

          // prefer server-provided pagination values when present
          this.pageNumber = res.pageNumber ?? this.pageNumber;
          this.pageSize = res.pageSize ?? this.pageSize;
          this.totalCount = res.totalCount ?? res.total ?? this.dataList?.length ?? 0;
          const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
          this.totalPages = res.totalPages ?? computedPages;
        } else {
          this.dataList = [];
          this.totalCount = 0;
          this.totalPages = 1;
        }
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load hospitals');
      },
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.loadHospitals();
  }

  onPageSizeChange() {
    // reset to first page on page size change and reload with new pageSize
    this.pageNumber = 1;
    this.loadHospitals();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadHospitals();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadHospitals();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadHospitals();
    }
  }

  onFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.addHospitalForm.invalid) {
      this.addHospitalForm.markAllAsTouched();
      return;
    }

    const v = this.addHospitalForm.value;

    const params = {
      HospitalName: v.HospitalName,
      HospitalPhoneNumber: v.HospitalPhoneNumber,
      HospitalRegistrationNumber: v.HospitalRegistrationNumber,
      HospitalEmail: v.HospitalEmail,
      HospitalAddress: v.HospitalAddress,
      City: v.City,
      State: v.State,
      PinCode: v.PinCode,
      CountryCode: v.CountryCode,
    };

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('HospitalImageFile', this.selectedFile);
    }

    this.api.addHospital(formData, params).subscribe({
      next: () => {
        this.toast.success('Hospital added successfully');
        this.closeModal(this.addHospitalModal);
        this.addHospitalForm.reset();
        this.selectedFile = undefined;
        this.loadHospitals();
      },
      error: () => {
        this.toast.error('Failed to add hospital');
      },
    });
  }

  formatDate(date: string) {
    return new Date(date).toDateString();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  resetAddHospitalForm() {
    this.addHospitalForm.reset();
    this.addHospitalForm.markAsPristine();
    this.addHospitalForm.markAsUntouched();
  }

  closeModal(modalRef: ElementRef | null) {
  if (!modalRef) return;

  const modalEl = modalRef.nativeElement;

  const modalInstance =
    bootstrap.Modal.getInstance(modalEl) ||
    new bootstrap.Modal(modalEl);

  modalInstance.hide();

  modalEl.addEventListener(
    'hidden.bs.modal',
    () => {
      this.resetAddHospitalForm();
    },
    { once: true } // 🔥 prevents multiple event bindings
  );
}

}
