import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Appointment } from '../services/appointment';
import { ToastService } from '../../../../../shared/services/toast-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AsidebarService } from '../../../../../shared/components/asidebar/services/asidebar-service';
import { AuthService } from '../../../../auth/services/auth-service';
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
  private asidebarService = inject(AsidebarService);
  private authService = inject(AuthService);
  
  isViewMode: boolean = false;
  canEdit: boolean = false; 

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
    selectedStatus: number = 3;
    prescriptionHelperMaster: any[] = [];
    symptomOptions: any[] = [];
    diagnosisOptions: any[] = [];
    adviceOptions: any[] = [];
    followUpOptions: any[] = [];
    totalAll: number = 0;
    totalScheduled: number = 0;
    totalPending: number = 0;
    totalCompleted: number = 0;
    totalCancelled: number = 0;
    isDoctorRole: boolean = false;
    doctorDetails: any = null;
    userRole: string = '';
    isReceptionist: boolean = false;
    isDoctor: boolean = false;

    medicineSearchText = '';
    medicineSearchResults: any[] = [];

    selectedDrug: any = null;
    selectedVariation: any = null;


    masterIds = {
      Symptoms: '',
      Diagnosis: '',
      Advice: '',
      FollowUp: ''
    };

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

//     getTodayDate(): string {
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = String(today.getMonth() + 1).padStart(2, '0');
//   const day = String(today.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }
  ngOnInit(): void {
    
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
      visitReason: [''],
      doctorId: [''],  
    });

    this.userRole = this.authService.getUserRole()?.toLowerCase() || '';
    this.isReceptionist = this.userRole === 'receptionist';
    this.isDoctor = this.userRole === 'doctor';

    // this.loadFullData();
    this.loadAppointments();
    this.loadMedicineTypes();
    this.loadLabTests();  
    // this.loadMedicineOptions(); 
    this.loadDoctorDetails(); 



  }

  searchMedicine() {
  if (!this.medicineSearchText || this.medicineSearchText.length < 1) {
    this.medicineSearchResults = [];
    return;
  }

  this.appointmentService
    .searchDrugByName(this.medicineSearchText)
    .subscribe((res: any) => {
      this.medicineSearchResults = res?.dataList || [];
    });
}

selectMedicineType(drug: any, type: any) {
  this.selectedDrug = drug;
  this.selectedVariation = type;

  this.medicineSearchResults = [];
  this.medicineSearchText = `${drug.drugName} (${type.typeName})`;

  this.getMedicineDetails(drug.drugId, type.variationId);
}

getMedicineDetails(drugId: string, variationId: string) {
  this.appointmentService
    .getMedicineDetails(drugId, variationId)
    .subscribe((res: any) => {
      if (!res?.data) return;

      const d = res.data;
      console.log(d);
      this.medicineForm = {
        type: d.drugTypeName || '',
        strength: d.strengths?.[0] || '',
        dosage: d.doses?.[0] || '',
        duration: d.durations?.[0] || '',
        advice: d.advice || ''
      };
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
  this.pageNumber = 1;
  this.loadAppointments();
}


loadAllDoctors() {
      this.appointmentService.getDoctor().subscribe({
        next: (res) => {
          this.doctorList = res.dataList;
        }
    });
}

loadDoctorDetails() {
  const role = this.authService.getUserRole();
  const doctorId = this.authService.getLoggedInUserId();

  this.isDoctorRole = (role?.toLowerCase() === 'doctor');

  if (this.isDoctorRole) {
    this.asidebarService.getDoctorDetailsById(doctorId).subscribe({
      next: (response: any) => {
        if (response.isSuccess) {
          this.doctorDetails = response.data;
          console.log(response.data);

          this.addAppointmentForm.patchValue({
            doctor: response.data.doctorId,
          });
          this.getDoctorFee();
          this.addAppointmentForm.get('appointmentFee')?.disable();
        }
      },
      error: (err) => console.error("API Error:", err)
    });
  } 
  else {
    // For receptionist → load all doctors
    this.loadAllDoctors();
    this.addAppointmentForm.get('appointmentFee')?.enable();
  }
}


loadAppointments() {
  const today = this.getTodayDate();

  this.appointmentService
    .getAllPatientAsPerDoctor(
      this.pageNumber,
      this.pageSize,
      this.searchText,
      this.selectedStatus,
      today
    )
    .subscribe({
      next: (response: any) => {

        this.masterData = response.dataList ?? [];
        this.filteredData = [...this.masterData];

        /* ✅ CALCULATE COUNTS ONLY WHEN ALL TAB */
        if (this.selectedStatus === 3) {
          this.totalAll = this.masterData.length;
          this.totalScheduled = this.masterData.filter(x => x.appointmentStatus === 0).length;
          this.totalPending   = this.masterData.filter(x => x.appointmentStatus === 1).length;
          this.totalCompleted = this.masterData.filter(x => x.appointmentStatus === 2).length;
          this.totalCancelled = this.masterData.filter(x => x.appointmentStatus === 4).length;
        }

        /* ✅ TEXT FILTER */
        if (this.searchText?.trim()) {
          const text = this.searchText.trim().toLowerCase();
          this.filteredData = this.filteredData.filter(x =>
            x.patientName?.toLowerCase().includes(text) ||
            x.mobileNo?.includes(text) ||
            x.uhid?.toLowerCase().includes(text) ||
            x.appointmentNo?.toLowerCase().includes(text)
          );
        }

        /* ❌ NO TAB FILTER HERE (API already did it) */

        /* ✅ PAGINATION */
        this.totalCount = this.filteredData.length;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);

        const start = (this.pageNumber - 1) * this.pageSize;
        this.dataList = this.filteredData.slice(start, start + this.pageSize);
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

// applyFilter(tab: string) {
// this.activeTab = tab;
// this.pageNumber = 1;

// switch (tab) {
//   case "Scheduled":
//     this.filteredData = this.masterData.filter(x => x.status === 0);
//     break;

//   case "Ongoing":
//     this.filteredData = this.masterData.filter(x => x.status === 1);
//     break;

//   case "Completed":
//     this.filteredData = this.masterData.filter(x => x.status === 2);
//     break;

//   case "Cancelled":
//     this.filteredData = this.masterData.filter(x => x.status === 4);
//     break;

//   default:
//     // 🔥 "All" tab – DO NOT check status
//     this.filteredData = this.masterData;
//     break;
// }

// if (this.searchText.trim() !== "") {
//   const s = this.searchText.toLowerCase();
//   this.filteredData = this.filteredData.filter(x =>
//     x.patientName.toLowerCase().includes(s) ||
//     x.doctorName.toLowerCase().includes(s) ||
//     x.patientPhone.includes(s) ||
//     x.visitReason.toLowerCase().includes(s)
//   );
// }

// this.totalCount = this.filteredData.length;
// this.totalPages = Math.ceil(this.totalCount / this.pageSize);
// this.paginate();
// }

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

  // get scheduledCount() {
  //   return this.masterData.filter(x => x.status === 0).length;
  // }

  // get ongoingCount() {
  //   return this.masterData.filter(x => x.status === 1).length;
  // }

  // get completedCount() {
  //   return this.masterData.filter(x => x.status === 2).length;
  // }

  // get cancelledCount() {
  //   return this.masterData.filter(x => x.status === 4).length;
  // }


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
    patientId: p.userId || p.id,   
    fullName: p.userName,
    gender: p.gender,
    dob: p.dob ? p.dob.split(" ")[0] : "",
    phoneNumber: p.phone,
    address: p.address,

    // weight: p.weight,
    // height: p.height,
    // pulse: p.pulse,
    // oxygen: p.oxygen,
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

medicineAutoData: any = {
  1: { // Drop
    Panadol: {
      strength: '300mg',
      dosage: '1 drop every 5 minutes',
      duration: 6,
      advice: 'Sed perferendis ipsam eum at laboriosam sequi provident.'
    }
  },
  2: { // Eye Ointment
    Augmentin: {
      strength: '5mg',
      dosage: '1+1+1',
      duration: 6,
      advice: 'Deserunt et quos quia excepturi fugiat dolor.'
    }
  }
};


medicineForm = {
  type: '',
  strength: '',
  dosage: '',
  duration: '',
  advice: ''
};


  loadMedicineTypes() {
  this.appointmentService.getMedicineType(this.pageNumber, this.pageSize).subscribe({
    next: (res) => {
      // if (res && res.dataList) {
      //   this.medicineTypes = res.dataList;   // Bind API list
      // }
      console.log(res);
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
    if (this.isReceptionist) {
    this.isViewMode = true;
    this.canEdit = false;

  }  else if (this.isDoctor) {
    // Doctor
    this.isViewMode = (mode === 'view');
    this.canEdit = true;
  }
  this.selectedAppointment = item;

  this.resetPrescription();
  this.loadExistingPrescription(item.appointmentId);
  this.loadPrescriptionMaster(); 

  let modal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
  modal.show();
}

loadPrescriptionMaster() {
  this.appointmentService.getPrescriptionMaster()
    .subscribe((res: any) => {

      if (!res.isSuccess) return;

      this.prescriptionHelperMaster = res.dataList;

      res.dataList.forEach((x: any) => {
        if (x.text === "Symptoms") this.masterIds.Symptoms = x.value;
        if (x.text === "Diagnosis") this.masterIds.Diagnosis = x.value;
        if (x.text === "Advise") this.masterIds.Advice = x.value;
        if (x.text === "FollowUp") this.masterIds.FollowUp = x.value;
      });
    });
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

  const masterId =
    type === "Symptoms" ? this.masterIds.Symptoms :
    type === "Diagnosis" ? this.masterIds.Diagnosis :
    type === "Advice" ? this.masterIds.Advice :
    type === "FollowUp" ? this.masterIds.FollowUp : '';

  if (!masterId) {
    console.error("Master ID not found!");
    return;
  }

  this.loadHelperValues(masterId);
}

loadHelperValues(masterId: string) {
  this.appointmentService.getPrescriptionValues(masterId)
    .subscribe((res: any) => {
      if (!res.isSuccess) return;

      this.optionsList = res.dataList.map((x: any) => ({
        label: x.value,
        selected: false
      }));

      let modal = new bootstrap.Modal(document.getElementById('checklistModal'));
      modal.show();
    });
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

    this.medicineForm = {
    type:'',
    strength: '',
    dosage: '',
    duration: '',
    advice: ''
  };
  this.loadMedicines();
}

onMedicineNameChange() {
  const med = this.medicineNames.find(m => m.value == this.selectedMedicineName);
  if (!med) return;

  const auto =
    this.medicineAutoData[this.selectedMedicineType]?.[med.text];

  if (auto) {
    this.medicineForm = {
      type: auto.typeName,
      strength: auto.strength,
      dosage: auto.dosage,
      duration: auto.duration,
      advice: auto.advice
    };
  }
}

addMedicine() {
  if (!this.selectedDrug || !this.selectedVariation) {
    this.toast.error('Select medicine');
    return;
  }

  this.prescription.medicines.push({
    drugId: this.selectedDrug.drugId,
    variationId: this.selectedVariation.variationId,
    type: this.selectedVariation.typeName,
    name: this.selectedDrug.drugName,
    strength: this.medicineForm.strength,
    dosage: this.medicineForm.dosage,
    duration: this.medicineForm.duration,
    advice: this.medicineForm.advice
  });

  // Reset
  this.selectedDrug = null;
  this.selectedVariation = null;
  this.medicineSearchText = '';
  this.medicineForm = {
    type:'',
    strength: '',
    dosage: '',
    duration: '',
    advice: ''
  };
}




// addMedicine() {
//   const med = this.medicineNames.find(m => m.value == this.selectedMedicineName);

//   if (!med) {
//     this.toast.error("Select a medicine");
//     return;
//   }

//   this.prescription.medicines.push({
//     type: med.type,
//     name: med.text,   // SHOW NAME
//     value: med.value, // SAVE VALUE
//     unit: med.unit,
//     qty: this.medicineQty,
//     frequency: null,
//     timings: [],
//     instruction: ''
//   });

//   this.selectedMedicineName = '';
//   this.medicineQty = 1;
// }



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

// selectFrequency(m: any, freqId: number) {
//   const selected = this.frequencyOptions.find(f => f.value === freqId);
//   if (!selected) return;

//   m.frequency = freqId;             // store ID
//   m.frequencyName = selected.label; // store label (optional)

//   m.timings = [];  
// }

// toggleTiming(m: any, timing: string) {
//   if (!m.frequency) {
//     this.toast.error("Select frequency first");
//     return;
//   }

//   const limit = m.frequency;  // frequencyId is already 1,2,3,4

//   if (m.timings.includes(timing)) {
//     m.timings = m.timings.filter((t: string) => t !== timing);
//     return;
//   }

//   if (m.timings.length >= limit) {
//     this.toast.error(`Only ${limit} timing(s) allowed for ${limit}`);
//     return;
//   }

//   m.timings.push(timing);
// }

// selectInstruction(m: any, instr: string) {
//   m.instruction = instr;
// }


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

// loadMedicineOptions() {
//   this.appointmentService.getMedicineFrequencies().subscribe({
//     next: (res: any) => {
//       this.frequencyOptions = res.dataList.map((f: any) => ({ label: f.name, value: f.id }));
//     },
//     error: (err) => console.error("Error loading medicine frequencies", err)
//   });

//   this.appointmentService.getMedicineTimings().subscribe({
//     next: (res: any) => {
//       this.timingOptions = res.dataList.map((t: any) => ({ label: t.name, value: t.name }));
//     },
//     error: (err) => console.error("Error loading medicine timings", err)
//   });

//   this.appointmentService.getMedicineInstructions().subscribe({
//     next: (res: any) => {
//       this.instructionOptions = res.dataList.map((i: any) => ({ label: i.name, value: i.name }));
//     },
//     error: (err) => console.error("Error loading medicine instructions", err)
//   });
// }

savePrescription() {
  if (!this.prescription.symptoms && !this.prescription.medicines.length) {
    this.toast.error("Add at least symptoms or medicines before saving");
    return;
  }
  const payload = {
    appointmentId: this.selectedAppointment?.appointmentId,

    symptoms: this.prescription.symptoms || '',
    diagnosis: this.prescription.diagnosis || '',
    advise: this.prescription.advice || '',
    followUp: this.prescription.followUp || '',
    nextFollowUpCount: 0,

    medicines: this.prescription.medicines.map(m => ({
      prescriptionId: this.selectedAppointment?.appointmentId,
      drugId: m.drugId || this.selectedDrug?.drugId,
      drugVariationid: m.variationId || this.selectedVariation?.variationId
    })),

    labtests: this.prescription.labTests.map(l => l.value)
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
      this.resetPrescription();
      this.loadAppointments();

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
  const appointmentId = item?.appointmentId;

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

resetAddAppointmentForm() {
  this.addAppointmentForm.reset({
    appointmentDate: this.getCurrentDateTime(),
    doctor: this.isDoctorRole ? this.doctorDetails?.doctorId : ''
  });
    this.getDoctorFee();

  this.patientList = [];
  this.selectedPatientId = null;

  this.addAppointmentForm.markAsPristine();
  this.addAppointmentForm.markAsUntouched();
}

}
