import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { PatientService } from '../services/patient-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../shared/services/toast-service';
import { DatePipe } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-view-all-patients',
  standalone: false,
  templateUrl: './view-all-patients.html',
  styleUrl: './view-all-patients.scss',
  providers: [DatePipe]
})
export class ViewAllPatients implements OnInit {
  @ViewChild('closeModalBtn') closeModalBtn!: ElementRef<HTMLButtonElement>;
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
  private api = inject(PatientService);
  private datePipe = inject(DatePipe);
  patientList: any[] = [];
  filteredPatients: any[] = [];
  paginatedPatients: any[] = [];
  patientForm!: FormGroup;
  today: string = new Date().toISOString().split('T')[0];
  searchText = "";
  pageNumber = 1;
  pageSize = 10;
  totalPages = 0;

  formatDate(date: string): string {
    return (this.datePipe.transform(date, 'dd MMM yyyy') || '').toUpperCase();
  }

ngOnInit() {
  this.loadPatients();
  this.patientForm = this.fb.group({
    fullName: ['', Validators.required],
    gender: ['', Validators.required],
    dob: ['', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    address: ['', Validators.required],
    abhaId: ['']
  });
}
 ngAfterViewInit(): void {
    const modalEl = document.getElementById('addPatientModal');

    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.resetPatientForm();
      });
    }
  }

openPatientDetails(patient: any) {
  if (!patient?.userId) {
    console.error('UserId missing', patient);
    return;
  }

  this.router.navigate(
    ['/patient/patient-details', patient.userId],
    { state: { patient } }   // 👈 send full data
  );
}



loadPatients() {
  this.patientService.getPatients(
    this.pageNumber,
    this.pageSize,
    this.searchText
  ).subscribe({
    next: (response) => {

      this.patientList = response.dataList
        .map((p: any) => ({
          ...p,
          age: this.calculateAge(p.dob)
        }))
        .sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      this.paginatedPatients = this.patientList; // ✅ directly assign
      this.totalPages = response.totalPages;      // ✅ from API
    },
    error: (err) => {
      console.error("API Error:", err);
    }
  });
}


  searchPatients() {
    this.pageNumber = 1;
    this.loadPatients();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadPatients();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadPatients();
    }
  }

  goToPage(page: number) {
    this.pageNumber = page;
    this.loadPatients();
  }

  isInvalid(field: string) {
    const control = this.patientForm.get(field);
    return control?.invalid && control?.touched;
  }

  onSubmit() {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.api.getRoleId("patient").subscribe({
      next: (roleRes: any) => {

        const roleId = roleRes.id;

        const payload = {
          fullName: this.patientForm.value.fullName,
          dateOfBirth: this.patientForm.value.dob,
          gender: this.patientForm.value.gender,
          phoneNumber: this.patientForm.value.phoneNumber,
          address: this.patientForm.value.address,
          role: roleId,
          abhaid: this.patientForm.value.abhaId,
        };

        console.log(payload);

        this.api.postPatient(payload).subscribe({
          next: (res) => {
            this.toast.success("Patient Saved Successfully");
            this.closeModal();
            this.loadPatients();
          },
          error: (err) => {
            console.error(err);
            this.toast.error("Something went wrong");
          }
        });

      },
      error: (err) => {
        console.error(err);
        this.toast.error("Failed to get role id");
      }
    });
  }
 resetPatientForm() {
    this.patientForm.reset();

    this.patientForm.markAsPristine();
    this.patientForm.markAsUntouched();
  }
openAddPatientModal() {
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}

calculateAge(dob: string): string {
  if (!dob) return '-';

  const birthDate = new Date(dob.replace(' ', 'T'));
  const today = new Date();

  const diffTime = today.getTime() - birthDate.getTime();
  if (diffTime < 0) return '0 days';

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }

  const years = Math.floor(diffDays / 365);
  return `${years} yr${years > 1 ? 's' : ''}`;
}

getGenderIcon(gender: string): string {
  const g = gender?.toLowerCase();
  if (g === 'm' || g === 'male') return 'fa-mars';
  if (g === 'f' || g === 'female') return 'fa-venus';
  return 'fa-genderless';
}
  closeModal(): void {
  this.closeModalBtn?.nativeElement.click();
}

}
