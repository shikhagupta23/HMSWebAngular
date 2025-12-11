import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Appointment } from '../services/appointment';
import { ToastService } from '../../../../../shared/services/toast-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
declare var bootstrap: any;


@Component({
  selector: 'app-view-todays-appointments',
  standalone: false,
  templateUrl: './view-todays-appointments.html',
  styleUrl: './view-todays-appointments.scss',
  providers: [DatePipe]
})
export class ViewTodaysAppointments implements OnInit {

  private appointmentService = inject(Appointment);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private selectedPatientId: string | null = null;
  private datePipe = inject(DatePipe);


  addAppointmentForm!: FormGroup;

  masterData: any[] = [];
  filteredData: any[] = [];
  dataList: any[] = [];
  searchText: string = "";
  appointmentList: any[] = [];

  pageNumber = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  activeTab: string = "All";
  doctorList : any[] = [];
  patientList: any[] = [];


  ngOnInit(): void {
    this.loadFullData();
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
      appointmentDate: [this.getCurrentDateTime(), Validators.required],
      doctor: ['', Validators.required],
      appointmentFee: [''],
      visitReason: ['']
    });
  }
  
@HostListener('document:click')
  clickOutside() {
    this.patientList = [];
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }


loadFullData() {
  const today = this.getTodayDate();

  this.appointmentService
    .getAppointments(this.pageNumber, this.pageSize, 0, today, this.searchText)
    .subscribe({
      next: (res: any) => {
        console.log("API Response:", res);
        console.log(this.searchText);
        // 🔥 VERY IMPORTANT
        this.masterData = res.dataList;   // API DATA
        this.filteredData = [...this.masterData];

        this.totalCount = res.totalCount ?? this.filteredData.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);

        this.paginate(); // finally paginate
      },
      error: () => this.toast.error("Something went wrong"),
    });
}


onSearchChange() {
    this.pageNumber = 1;

  this.loadFullData();
}

applyFilter(tab: string) {
this.activeTab = tab;
this.pageNumber = 1;

switch (tab) {
  case "Scheduled":
    this.filteredData = this.masterData.filter(x => x.status === 0);
    break;

  case "Ongoing":
    this.filteredData = this.masterData.filter(x => x.status === 1);
    break;

  case "Completed":
    this.filteredData = this.masterData.filter(x => x.status === 2);
    break;

  case "Cancelled":
    this.filteredData = this.masterData.filter(x => x.status === 4);
    break;

  default:
    // 🔥 "All" tab – DO NOT check status
    this.filteredData = this.masterData;
    break;
}

// Search filter
if (this.searchText.trim() !== "") {
  const s = this.searchText.toLowerCase();
  this.filteredData = this.filteredData.filter(x =>
    x.patientName.toLowerCase().includes(s) ||
    x.doctorName.toLowerCase().includes(s) ||
    x.patientPhone.includes(s) ||
    x.visitReason.toLowerCase().includes(s)
  );
}

this.totalCount = this.filteredData.length;
this.totalPages = Math.ceil(this.totalCount / this.pageSize);
this.paginate();
}



  paginate() {
    const start = (this.pageNumber - 1) * this.pageSize;
    this.dataList = this.filteredData.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.paginate();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.paginate();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.paginate();
    }
  }

  formatDate(date: string): string {
    return (this.datePipe.transform(date, 'dd MMM yyyy hh.mm a') || '').toUpperCase();
  }

  get scheduledCount() {
    return this.masterData.filter(x => x.status === 0).length;
  }

  get ongoingCount() {
    return this.masterData.filter(x => x.status === 1).length;
  }

  get completedCount() {
    return this.masterData.filter(x => x.status === 2).length;
  }

  get cancelledCount() {
    return this.masterData.filter(x => x.status === 4).length;
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

  if (!doctorId) return;

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
  debugger;
 

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

        const modalEl = document.getElementById('addAppointmentModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
            modalInstance.hide();
        }
        this.loadFullData();
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
  openAddAppointmentModal() {
    const modal = new bootstrap.Modal(document.getElementById('addAppointmentModal'));
    modal.show();
}

getCurrentDateTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0,16);
}

}
