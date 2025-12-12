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

  isViewMode: boolean = false;

  addAppointmentForm!: FormGroup;

  masterData: any[] = [];
  filteredData: any[] = [];
  dataList: any[] = [];
  searchText: string = "";
  appointmentList: any[] = [];
 
    activeField: string = '';
    optionsList: any[] = [];
    medicineTypes: any[] = [];
    medicineNames: any[] = [];
    labTests: any[] = [];
    selectedLabTest: string = '';
    frequencyOptions: any[] = [];
    timingOptions: any[] = [];
    instructionOptions: any[] = [];
    selectedAppointment: any = null; 
    selectedMedicineType:any = '';
    selectedMedicineName = '';
    medicineQty: number = 1;  
    selectedUnit: string = '';
    selectedStatus: number = 0;

  pageNumber = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;
  apiPageSize = 100;

  activeTab: string = "All";
  doctorList : any[] = [];
  patientList: any[] = [];

    prescription = {
      symptoms: '',
      diagnosis: '',
      advice: '',
      followUp: '',
      medicines: [] as any[],
      labTests: [] as { name: string; value: string }[]  
    };

  ngOnInit(): void {
    // this.loadFullData();
    this.loadAppointments();
    this.loadMedicineTypes();
    this.loadLabTests();  
    this.loadMedicineOptions(); 
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

changeStatus(status: number) {
  this.selectedStatus = status;
  this.pageNumber = 1; // reset pagination
  this.loadAppointments();
}


loadAppointments() {
  this.appointmentService
    .getPatientAsPerDoctor(this.pageNumber, this.pageSize, this.searchText, this.selectedStatus )
    .subscribe({
      next: (response: any) => {
        console.log("API Response:", response);
        console.log("Search Text : ", this.searchText);

        this.masterData = response.dataList;
        this.filteredData = [...this.masterData];

        if (this.searchText.trim() !== "") {
          const s = this.searchText.toLowerCase();
          this.filteredData = this.filteredData.filter(x =>
            (x.patientName?.toLowerCase() || "").includes(s) ||
            (x.doctorName?.toLowerCase() || "").includes(s) ||
            (x.patientPhone || "").includes(s) ||
            (x.visitReason?.toLowerCase() || "").includes(s)
          );
        }

        const start = (this.pageNumber - 1) * this.pageSize;

        // 🔥 FIX: Use filteredData
        this.dataList = this.filteredData.slice(start, start + this.pageSize);

        this.totalCount = this.filteredData.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
      },
      error: () => this.toast.error("Failed to load appointments")
    });
}


loadFullData() {
  const today = this.getTodayDate();

  this.appointmentService
    .getAppointments(this.pageNumber, this.pageSize, 0, today, this.searchText)
    .subscribe({
      next: (res: any) => {
        console.log("API Response:", res);
        console.log(this.searchText);

        this.masterData = res.dataList;
        this.filteredData = [...this.masterData];

        this.totalCount = res.totalCount ?? this.filteredData.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);

        this.paginate();
      },
      error: () => this.toast.error("Something went wrong"),
    });
}


onSearchChange() {
    this.pageNumber = 1;

  this.loadAppointments();
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
        this.loadAppointments();
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


// PRESCRIPTION CODE


convertTimingToNumber(t: string): number {
  const map: any = { Morning: 1, Afternoon: 2, Evening: 3, Night: 4 };
  return map[t] || 0;
}

getFrequencyId(freqName: string): number {
  const f = this.frequencyOptions.find(x => x.label === freqName);
  return f ? f.value : 0;
}


allMedicineNames: any = {
  Tablet: ['Paracetamol', 'Azithromycin', 'Levocetirizine'],
  Capsule: ['Amoxicillin', 'Omeprazole'],
  Syrup: ['Cough Syrup', 'Vitamin C Syrup'],
  Injection: ['Insulin', 'Diclofenac']
};

symptomOptions = [
  { label: 'Fever', selected: false },
  { label: 'Cough', selected: false },
  { label: 'Body Pain', selected: false },
];

diagnosisOptions = [
  { label: 'Cold & Flu', selected: false },
  { label: 'Infection', selected: false },
  { label: 'Weakness', selected: false },
];

adviceOptions = [
  { label: 'Drink warm water', selected: false },
  { label: 'Take rest', selected: false },
  { label: 'Avoid cold food', selected: false },
];

followUpOptions = [
  { label: 'Visit after 3 days', selected: false },
  { label: 'Return if symptoms worsen', selected: false },
];

  loadMedicineTypes() {
  this.appointmentService.getMedicineType().subscribe({
    next: (res) => {
      if (res && res.dataList) {
        this.medicineTypes = res.dataList;   // Bind API list
      }
    },
    error: (err) => {
      console.error('Error loading medicine types', err);
    }
  });
}

  // --------------------------
  // 🔥 OPEN MAIN MODAL
  // --------------------------
openPrescriptionModal(item: any, mode: 'view' | 'start' = 'start') {
  this.isViewMode = mode === 'view'; 

  this.selectedAppointment = item;
  this.resetPrescription();
  this.loadExistingPrescription(item.appointmentId);

  let modal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
  modal.show();
}


loadExistingPrescription(appointmentId: number) {
  this.appointmentService
    .getPrescriptionByAppointmentId(appointmentId.toString())
    .subscribe({
      next: (res: any) => {

        if (!res || !res.data) return;

        const p = res.data;

        console.log(p);
        // ---------------------
        // 🔥 Bind Text Fields
        // ---------------------
        this.prescription.symptoms = p.symptoms || "";
        this.prescription.diagnosis = p.diagnosis || "";
        this.prescription.advice = p.advise || "";
        this.prescription.followUp = p.followUp || "";

        // ---------------------
        // 🔥 Bind Checklist UI (optional highlight)
        // ---------------------
        this.symptomOptions.forEach(x => x.selected = this.prescription.symptoms.includes(x.label));
        this.diagnosisOptions.forEach(x => x.selected = this.prescription.diagnosis.includes(x.label));
        this.adviceOptions.forEach(x => x.selected = this.prescription.advice.includes(x.label));
        this.followUpOptions.forEach(x => x.selected = this.prescription.followUp.includes(x.label));

        // ---------------------
        // 🔥 Bind Medicines
        // ---------------------
        this.prescription.medicines = (p.medicines || []).map((m: any) => {
          return {
            type: m.medicineType || "",
            name: m.name || "",
            value: m.medicineId || "",
            unit: m.unit || "",
            dosage: m.dosage || "",
            frequency: this.getFrequencyId(m.frequency),   // convert string → ID
            frequencyName: m.frequency,                    // store original text (optional)
            timings: (m.timmingNames || []),
            instruction: m.instructions || "",
            duration: Number(m.duration || 1)
          };
        });

        // ---------------------
        // 🔥 Bind Lab Tests
        // ---------------------
        this.prescription.labTests = (p.labtests || []).map((l: any) => ({
          name: l.testName,
          value: l.labTestId
        }));

        console.log("BOUND PRESCRIPTION:", this.prescription);
      },
      error: (err) => console.error(err)
    });
}



  // --------------------------
  // 🔥 OPEN CHECKLIST
  // --------------------------
  openList(type: string) {
    this.activeField = type;

    if (type === 'Symptoms') this.optionsList = this.symptomOptions;
    if (type === 'Diagnosis') this.optionsList = this.diagnosisOptions;
    if (type === 'Advice') this.optionsList = this.adviceOptions;
    if (type === 'FollowUp') this.optionsList = this.followUpOptions;

    let modal = new bootstrap.Modal(document.getElementById('checklistModal'));
    modal.show();
  }

  // --------------------------
  // 🔥 UPDATE TEXTAREA
  // --------------------------
  updateText() {
    const selectedValues = this.optionsList
      .filter(x => x.selected)
      .map(x => x.label)
      .join(', ');

    if (this.activeField === 'Symptoms')
      this.prescription.symptoms = selectedValues;

    if (this.activeField === 'Diagnosis')
      this.prescription.diagnosis = selectedValues;

    if (this.activeField === 'Advice')
      this.prescription.advice = selectedValues;

    if (this.activeField === 'FollowUp')
      this.prescription.followUp = selectedValues;
  }

onMedicineTypeChange() {
  const selected = this.medicineTypes.find(x => x.value == this.selectedMedicineType);

  this.selectedUnit = selected?.unit || '';

  this.loadMedicines();
}



addMedicine() {
  const med = this.medicineNames.find(m => m.value == this.selectedMedicineName);

  if (!med) {
    this.toast.error("Select a medicine");
    return;
  }

  this.prescription.medicines.push({
    type: med.type,
    name: med.text,   // SHOW NAME
    value: med.value, // SAVE VALUE
    unit: med.unit,
    qty: this.medicineQty,
    frequency: null,
    timings: [],
    instruction: ''
  });

  this.selectedMedicineName = '';
  this.medicineQty = 1;
}



removeMedicine(index: number) {
  this.prescription.medicines.splice(index, 1);
}

addLabTest() {
  const selected = this.labTests.find(x => x.value == this.selectedLabTest);

  if (!selected) {
    this.toast.error("Please select a lab test");
    return;
  }

  this.prescription.labTests.push({
    name: selected.text,
    value: selected.value
  });

  this.selectedLabTest = '';
}




removeLabTest(index: number) {
  this.prescription.labTests.splice(index, 1);
}

selectFrequency(m: any, freqId: number) {
  const selected = this.frequencyOptions.find(f => f.value === freqId);
  if (!selected) return;

  m.frequency = freqId;             // store ID
  m.frequencyName = selected.label; // store label (optional)

  m.timings = [];  
}


// --------------------------
// 🔥 TOGGLE TIMING WITH LIMIT
// --------------------------
toggleTiming(m: any, timing: string) {
  if (!m.frequency) {
    this.toast.error("Select frequency first");
    return;
  }

  const limit = m.frequency;  // frequencyId is already 1,2,3,4

  if (m.timings.includes(timing)) {
    m.timings = m.timings.filter((t: string) => t !== timing);
    return;
  }

  if (m.timings.length >= limit) {
    this.toast.error(`Only ${limit} timing(s) allowed for ${limit}`);
    return;
  }

  m.timings.push(timing);
}

// --------------------------
// 🔥 SELECT INSTRUCTION
// --------------------------
selectInstruction(m: any, instr: string) {
  m.instruction = instr;  // only one instruction
}


loadMedicines() {
  if (!this.selectedMedicineType) {
    this.medicineNames = [];
    return;
  }

  this.appointmentService.getMedicineList(this.selectedMedicineType).subscribe({
    next: (res) => {
      this.medicineNames = res.dataList;   
    },
    error: () => {
      this.medicineNames = [];
    }
  });
}

loadLabTests() {
  this.appointmentService.getLabTest().subscribe({
    next: (res) => {
      this.labTests = res?.dataList || [];
    },
    error: (err) => console.error("Error loading lab tests", err)
  });
}

loadMedicineOptions() {
  // Load frequencies
  this.appointmentService.getMedicineFrequencies().subscribe({
    next: (res: any) => {
      this.frequencyOptions = res.dataList.map((f: any) => ({ label: f.name, value: f.id }));
    },
    error: (err) => console.error("Error loading medicine frequencies", err)
  });

  // Load timings
  this.appointmentService.getMedicineTimings().subscribe({
    next: (res: any) => {
      this.timingOptions = res.dataList.map((t: any) => ({ label: t.name, value: t.name }));
    },
    error: (err) => console.error("Error loading medicine timings", err)
  });

  // Load instructions
  this.appointmentService.getMedicineInstructions().subscribe({
    next: (res: any) => {
      this.instructionOptions = res.dataList.map((i: any) => ({ label: i.name, value: i.name }));
    },
    error: (err) => console.error("Error loading medicine instructions", err)
  });
}

savePrescription() {
  if (!this.prescription.symptoms && !this.prescription.medicines.length) {
    this.toast.error("Add at least symptoms or medicines before saving");
    return;
  }

  // Validate medicines
  for (let med of this.prescription.medicines) {
    if (!med.frequency) {
      this.toast.error(`Select frequency for ${med.name}`);
      return;
    }
    if (med.timings.length === 0) {
      this.toast.error(`Select at least one timing for ${med.name}`);
      return;
    }
    if (!med.instruction) {
      this.toast.error(`Select an instruction for ${med.name}`);
      return;
    }
  }

  // Validate lab tests (optional)
  // if needed: ensure LabTestId is valid

const payload: any = {
  AppointmentId: this.selectedAppointment?.appointmentId || '',
  AppointmentViewId: String(this.selectedAppointment?.appointmentViewId || ''),
  PatientName: this.selectedAppointment?.patientName || '',
  Age: String(this.selectedAppointment?.age || 0),
  Gender: this.selectedAppointment?.gender || 'Unknown',
  PatientPhone: this.selectedAppointment?.patientPhone || '',
  AppointmentDate: this.selectedAppointment?.appointmentDate || new Date().toISOString(),
  BookedDate: this.selectedAppointment?.createdAt || new Date().toISOString(),

  Prescription:
    this.prescription.symptoms ||
    this.prescription.diagnosis ||
    this.prescription.advice ||
    'N/A',

  Symptoms: this.prescription.symptoms || '',
  Diagnosis: this.prescription.diagnosis || '',
  Advise: this.prescription.advice || '',
  FollowUp: this.prescription.followUp || '',
  NextFollowUpCount: 0,

  Medicines: this.prescription.medicines.map(m => ({
    MedicineId: m.value,
    Name: m.name,
    Dosage: `${m.dosage}`,
    Frequency: m.frequencyName,
    Duration: String(m.duration || 1),       // ✅ must be string
    Instructions: m.instruction,
Timming: m.timings.map((t: string) => this.convertTimingToNumber(t)),
  // ✅ convert to int[]
    TimmingNames: m.timings                // optional, backend allows
  })),

  Labtests: this.prescription.labTests.map(l => ({
    LabTestId: l.value,
    TestName: l.name,
    Category: 'General'
  }))
};

  console.log("DTO PAYLOAD:", payload);

  this.appointmentService.savePrescription(payload).subscribe({
    next: (res: any) => {
      if (res.isSuccess) {
        this.toast.success("Prescription saved successfully!");

      const modalEl: any = document.getElementById('prescriptionModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.hide();
      }

      // Optionally reset the form
      this.resetPrescription();
      const appointmentId = this.selectedAppointment?.appointmentId;
      if (appointmentId) {
        this.appointmentService.updateAppointmentStatus(appointmentId.toString(), 2).subscribe({
          next: () => {
            console.log(`Appointment ${appointmentId} marked as Completed`);
          },
          error: (err) => {
            console.error("Error updating appointment status", err);
            this.toast.error("Prescription saved but failed to update appointment status");
          }
        });
      }
      } else {
        this.toast.error(res.message || "Failed to save prescription");
      }
    },
    error: (err) => {
      console.error("Error saving prescription", err);
      this.toast.error("Error saving prescription");
    }
  });
}

cancelAppointment(item: any) {
  const appointmentId = this.selectedAppointment?.appointmentId;

  if (!appointmentId) return;

  this.appointmentService.updateAppointmentStatus(appointmentId.toString(), 4)
    .subscribe({
      next: (res: any) => {
        this.toast.success("Appointment cancelled successfully");

        // refresh list
        this.loadAppointments();
      },
      error: () => {
        this.toast.error("Failed to cancel appointment");
      }
    });
}


resetPrescription() {
  this.prescription = {
    symptoms: '',
    diagnosis: '',
    advice: '',
    followUp: '',
    medicines: [],
    labTests: []
  };

  this.symptomOptions.forEach(x => x.selected = false);
  this.diagnosisOptions.forEach(x => x.selected = false);
  this.adviceOptions.forEach(x => x.selected = false);
  this.followUpOptions.forEach(x => x.selected = false);
}

}
