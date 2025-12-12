import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalService } from './services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';

declare const bootstrap: any;

@Component({
  selector: 'app-hospital',
  standalone: false,
  templateUrl: './hospital.html',
  styleUrl: './hospital.scss',
})
export class Hospital implements OnInit {
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

  initForm() {
    this.addHospitalForm = this.fb.group({
      HospitalName: ['', Validators.required],
      HospitalPhoneNumber: ['', [Validators.required]],
      HospitalRegistrationNumber: [''],
      HospitalEmail: ['', [Validators.email]],
      HospitalAddress: [''],
      HospitalImageFile: [null]
    });
  }

  loadHospitals() {
    this.api.getHospitals(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        // API returns: { dataList: [], pageNumber, pageSize, totalCount, totalPages, ... }
        if (res) {
          this.dataList = res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);

          // prefer server-provided pagination values when present
          this.pageNumber = res.pageNumber ?? this.pageNumber;
          this.pageSize = res.pageSize ?? this.pageSize;
          this.totalCount = res.totalCount ?? res.total ?? (this.dataList?.length ?? 0);
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
      }
    });
  }

  onSearch() {
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

    const formData = new FormData();
    const v = this.addHospitalForm.value;
    formData.append('HospitalName', v.HospitalName);
    formData.append('HospitalPhoneNumber', v.HospitalPhoneNumber);
    formData.append('HospitalRegistrationNumber', v.HospitalRegistrationNumber || '');
    formData.append('HospitalEmail', v.HospitalEmail || '');
    formData.append('HospitalAddress', v.HospitalAddress || '');
    if (this.selectedFile) {
      formData.append('HospitalImageFile', this.selectedFile);
    }
console.log('Submitting hospital:',formData);
    this.api.addHospital(formData).subscribe({
      next: (res) => {
        this.toast.success('Hospital added successfully');
        // close modal
        const modalEl = document.getElementById('addHospitalModal');
        if (modalEl) {
          const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          m.hide();
        }
        this.addHospitalForm.reset();
        this.selectedFile = undefined;
        this.loadHospitals();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to add hospital');
      }
    });
  }

  formatDate(date: string) {
    return new Date(date).toDateString();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

}
