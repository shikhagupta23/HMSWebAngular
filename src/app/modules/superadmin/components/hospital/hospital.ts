import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalService } from '../../services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';
import { environment } from '../../../../../environment/environment';
import { Router } from '@angular/router';

declare const bootstrap: any;

@Component({
  selector: 'app-hospital',
  standalone: false,
  templateUrl: './hospital.html',
  styleUrl: './hospital.scss',
})
export class Hospital implements OnInit, AfterViewInit {
  @ViewChild('addHospitalModal') addHospitalModal!: ElementRef;
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private api = inject(HospitalService);
  private toast = inject(ToastService);
  dataList: any[] = [];

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';

  addHospitalForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  isEditMode = false;
  editingHospitalId: string | null = null;
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

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    this.selectedFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeImage(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    this.imagePreview = null;

    // reset native file input UI
    fileInput.value = '';
  }
  onSubmit() {
    if (this.addHospitalForm.invalid) {
      this.addHospitalForm.markAllAsTouched();
      return;
    }

    const v = this.addHospitalForm.value;

    const basePayload = {
      HospitalName: v.HospitalName,
      HospitalAddress: v.HospitalAddress,
      HospitalEmail: v.HospitalEmail,
      HospitalPhoneNumber: v.HospitalPhoneNumber,
      HospitalRegistrationNumber: v.HospitalRegistrationNumber,
      City: v.City,
      State: v.State,
      PinCode: v.PinCode,
    };

    const payloadEdit = {
      ...basePayload,
      Id: this.editingHospitalId, // only for PUT
    };

    const payloadCreate = {
      ...basePayload, // POST does not need Id
    };

    const formData = new FormData();

    // Object.entries(payload).forEach(([key, value]) => {
    //   if (value !== null && value !== undefined) {
    //     formData.append(key, value as any);
    //   }
    // });

    if (this.selectedFile) {
      formData.append('HospitalImageFile', this.selectedFile, this.selectedFile.name);
    }

    if (this.isEditMode) {
      // ✅ UPDATE
      this.api.updateHospital(formData, payloadEdit).subscribe({
        next: () => {
          this.toast.success('Hospital updated successfully');
          this.afterSave();
        },
        error: () => this.toast.error('Failed to update hospital'),
      });
    } else {
      // ✅ CREATE
      this.api.addHospital(formData, payloadCreate).subscribe({
        next: () => {
          this.toast.success('Hospital added successfully');
          this.afterSave();
        },
        error: () => this.toast.error('Failed to add hospital'),
      });
    }
  }

  afterSave() {
    this.closeModal();
    this.resetAddHospitalForm();
    this.isEditMode = false;
    this.editingHospitalId = null;
    this.selectedFile = null;
    this.imagePreview = null;
    this.loadHospitals();
  }

  formatDate(date: string) {
    return new Date(date).toDateString();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  resetAddHospitalForm() {
    console.log('7777777777');
    this.addHospitalForm.reset();
    this.addHospitalForm.markAsPristine();
    this.addHospitalForm.markAsUntouched();
  }

  closeModal() {
    this.closeModalBtn?.nativeElement.click();
  }

  getHospitalLogo(h: any): string {
    if (!h?.hospitalImage) return '';

    return `${environment.hospitalLogoPath}${h.hospitalImage}`;
  }
  viewHospital(hospitalDetails: any) {
    console.log(hospitalDetails);
    this.router.navigateByUrl(
      `superadmin/hospital-details/${this.slugify(hospitalDetails.hospitalName)}`,
      {
        state: {
          hospitalId: hospitalDetails,
          hospitalDetails: hospitalDetails,
        },
      }
    );
  }
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-') // spaces & underscores → -
      .replace(/[^\w-]+/g, '') // remove special chars
      .replace(/--+/g, '-'); // multiple - → single -
  }
  onToggleExtend(item: any, checked: boolean) {
  const id = item.id;

  console.group('🔁 Toggle Hospital Status');
  console.log('Item:', item);
  console.log('HospitalId:', id);
  console.log('Checked:', checked);

  if (!id) {
    this.toast.error('Invalid hospital id');
    console.groupEnd();
    return;
  }

  const previousStatus = item.isActive;

  // optimistic UI update
  item._updatingExtend = true;
  item.isActive = checked;

  this.api.updateStatus(id, checked).subscribe({
    next: (res: any) => {
      this.toast.success('Hospital status updated');
      item._updatingExtend = false;
      console.groupEnd();
    },
    error: (err) => {
      console.error(err);

      // rollback UI
      item.isActive = previousStatus;
      item._updatingExtend = false;

      this.toast.error('Failed to update status');
      console.groupEnd();
    }
  });
}

  editHospital(h: any) {
    this.isEditMode = true;
    this.editingHospitalId = h.id;

    this.addHospitalForm.patchValue({
      HospitalName: h.hospitalName,
      HospitalRegistrationNumber: h.hospitalRegistrationNumber,
      HospitalPhoneNumber: h.hospitalPhoneNumber,
      HospitalEmail: h.hospitalEmail,
      HospitalAddress: h.hospitalAddress,
      City: h.city,
      State: h.state,
      PinCode: h.pinCode,
    });

    // image preview (existing image)
    if (h.hospitalImage) {
      this.imagePreview = `${environment.hospitalLogoPath}${h.hospitalImage}`;
    }

    // open modal programmatically
    const modal = new bootstrap.Modal(this.addHospitalModal.nativeElement);
    modal.show();
  }
}
