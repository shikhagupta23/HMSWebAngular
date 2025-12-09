import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Appointment } from '../services/appointment';
import { ToastService } from '../../../../../shared/services/toast-service';

@Component({
  selector: 'app-add-appointment',
  standalone : false,
  templateUrl: './add-appointment.html',
  styleUrls: ['./add-appointment.scss']
})
export class AddAppointment implements OnInit {

  addAppointmentForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private appointmentService = inject(Appointment);
  private toast = inject(ToastService);
  patientList: any[] = [];
  private appointmentId : string | null = null;
  private selectedPatientId: string | null = null;
  todayDate: string = new Date().toISOString().split('T')[0];
  TodayDateTime: string = new Date().toISOString().slice(0, 16);

  doctorList = [
    { userId: 3, fullName: 'Dr. Sharma' }
  ];
  constructor() { }

  ngOnInit(): void {

    this.appointmentService.getDoctor().subscribe({
      next: (res) => {
        this.doctorList = res.dataList;
      }
    });


    this.addAppointmentForm = this.fb.group({
       patientId: [''],
      fullName: ['', Validators.required],
      email: [''],
      dob: [''],
      gender: [''],
      bloodGroup: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: [''],
      weight: [''],
      height: [''],
      pulse: [''],
      oxygen: [''],
      referDoctor: [''],
      abhaId: [''],
      doctorDegree: [''],
      doctorSpeciality: [''],
      doctorRegNo: [''],
      department: [''],

      appointmentDate: ['', Validators.required],
      doctor: ['', Validators.required],
      appointmentFee: [''],
      visitReason: ['']
    });

  }
@HostListener('document:click')
clickOutside() {
  this.patientList = [];
}


  getPatientByTerm()
  {
    const term = this.addAppointmentForm.get('fullName')?.value || '';
    this.appointmentService.getPatientByNameOrPhone(term).subscribe({
      next: (res) => {
        console.log("Patient search results:", res);
         this.patientList = res.dataList ?? [];
      },
      error: (err) => {
        console.error("Error fetching patient data:", err);
      }
    });
  }

selectPatient(p: any) {

  this.patientList = [];

  this.addAppointmentForm.patchValue({
    selectedPatientId: p.userId || p.id,   
    fullName: p.userName,
    gender: p.gender,
    dob: p.dob ? p.dob.split(" ")[0] : "",
    phoneNumber: p.phone,
    address: p.address,

    weight: p.weight,
    height: p.height,
    pulse: p.pulse,
    oxygen: p.oxygen,
    abhaId: p.abhaId
  });

  this.selectedPatientId = p.userId || p.id;
}


  isInvalid(controlName: string): boolean {
    const control = this.addAppointmentForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
 
  onCancel()
  {
    this.router.navigate(['/doctor/appointment/todayappointments']);
  }

checkPhone() {
  let currentValue = this.addAppointmentForm.get('phoneNumber')?.value || '';

  currentValue = currentValue.replace(/[^0-9]/g, '');

  if (currentValue.length > 10) {
    currentValue = currentValue.substring(0, 10);
  }

  this.addAppointmentForm.get('phoneNumber')?.setValue(currentValue, { emitEvent: false });
}

 getDoctorFee() {
  const doctorId = this.addAppointmentForm.get('doctor')?.value;

  if (!doctorId) return; // no doctor selected

  this.appointmentService.getDoctorFee(doctorId).subscribe({
    next: (res: any) => {
      if (res.isSuccess) {
        this.addAppointmentForm.get('appointmentFee')?.setValue(res.data);
      } else {
        this.toast.error(res.message || "Failed to fetch doctor fee");
      }
    },
    error: () => {
      this.toast.error("Error fetching doctor fee");
    }
  });
}


onSubmit() {
  if (this.addAppointmentForm.invalid) {
    this.addAppointmentForm.markAllAsTouched();
    return;
  }
  const form = this.addAppointmentForm.value;

  const payload = {
    PatientId: this.selectedPatientId || "",
    DoctorId: form.doctor,
    VisitReason: form.visitReason || "",
    AppointmentFee: Number(form.appointmentFee) || 0,
    AppointmentDate: new Date(form.appointmentDate).toISOString(),

    patientData: {
      FullName: form.fullName,
      Gender: form.gender,
      DateOfBirth: form.dob ? new Date(form.dob).toISOString() : null,
      PhoneNumber: form.phoneNumber,
      Address: form.address,
      ReferDoctorName: form.referDoctor || "",
      ABHAID: form.abhaId || "",
      Weight: Number(form.weight) || 0,
      Height: Number(form.height) || 0,
      Pulse: Number(form.pulse) || 0,
      Oxygen: Number(form.oxygen) || 0
    }
  };

  console.log("Final Payload:", payload);

  this.appointmentService.saveAppointment(payload).subscribe({
    next: (res: any) => {
      if (res.isSuccess) {
        this.toast.success(res.message ||"Appointment added successfully");

        this.addAppointmentForm.reset();

      } else {
        this.toast.error(res.message || "Failed to add appointment");
      }
    },
    error: (err) => {
      this.toast.error("Error occurred while saving appointment");
    }
  });
}

}
