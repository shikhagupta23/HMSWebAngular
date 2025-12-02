import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../shared/services/toast-service';
import { PatientService } from '../services/patient-service';

@Component({
  selector: 'app-add-new-patient',
  standalone: false,
  templateUrl: './add-new-patient.html',
  styleUrls: ['./add-new-patient.scss']
})
export class AddNewPatient implements OnInit {

  patientForm!: FormGroup;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
  private api = inject(PatientService);
  today: string = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.patientForm = this.fb.group({
      fullName: ['', Validators.required],
      gender: ['', Validators.required],
      dob: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', Validators.required],
      abhaId: ['']
    });
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

            this.router.navigate(['/doctor/patient/allpatient']);
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

}
