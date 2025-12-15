import { Component, inject, OnInit } from '@angular/core';
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
  pageSize = 50;
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

  loadPatients() {
    this.patientService.getPatients(
      this.pageNumber,
      this.pageSize,
      this.searchText
    ).subscribe({
      next: (response) => {

        console.log("API Response:", response);

        this.patientList = response.dataList;

        this.filteredPatients = [...this.patientList];

        // Update pagination based on API response
        this.totalPages = response.totalPages;

        this.paginatedPatients = this.filteredPatients; // API already gives paginated data
      },
      error: (err) => {
        console.error("API Error:", err);
      }
    });
  }

  // 🔎 Search — call API again with search text
  searchPatients() {
    this.pageNumber = 1;
    this.loadPatients();
  }

  // ⏭ Next Page
  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadPatients();
    }
  }

  // ⏮ Previous Page
  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadPatients();
    }
  }

  // Go to a page
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
            this.patientForm.reset();

            const modalEl = document.getElementById('addPatientModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }
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

openAddPatientModal() {
    const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
    modal.show();
}
}
