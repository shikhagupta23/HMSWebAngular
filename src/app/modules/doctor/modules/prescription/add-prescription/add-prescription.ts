import { Component, inject, OnInit } from '@angular/core';
import { ToastService } from '../../../../../shared/services/toast-service';
import { PrescriptionService } from '../services/prescription-service';
import { HttpClient, HttpParams } from '@angular/common/http';
declare var bootstrap: any;

@Component({
  selector: 'app-prescription',
  standalone: false,
  templateUrl: './add-prescription.html',
  styleUrls: ['./add-prescription.scss'],
})
export class AddPrescription implements OnInit {
 private http = inject(HttpClient);

  private doctorService = inject(PrescriptionService);
  private toast = inject(ToastService);

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


  // Form data
  prescription = {
    symptoms: '',
    diagnosis: '',
    advice: '',
    followUp: '',
    medicines: [] as any[],
labTests: [] as { name: string; value: string }[]  
  };



  selectedMedicineType:any = '';
  selectedMedicineName = '';
  medicineQty: number = 1;  
  selectedUnit: string = '';

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


  // Option lists
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

  // Pagination variables
  dataList: any[] = [];
  searchText: string = "";

  pageNumber = 1;
  pageSize = 50;               // UI page size
  apiPageSize = 100;          // API mandatory page size

  totalCount = 0;
  totalPages = 0;

  // --------------------------
  // 🔥 ON INIT
  // --------------------------
  ngOnInit(): void {
    this.loadAppointments();
    this.loadMedicineTypes();
    this.loadLabTests();  
    this.loadMedicineOptions(); 
  }

  loadMedicineTypes() {
  this.doctorService.getMedicineType().subscribe({
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
openPrescriptionModal(item: any) {
  this.selectedAppointment = item;
  this.resetPrescription();
  this.loadExistingPrescription(item.appointmentId);

  let modal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
  modal.show();
}


loadExistingPrescription(appointmentId: number) {
  this.doctorService
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

  // --------------------------
  // 🔥 SAVE BUTTON
  // --------------------------

  formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  // --------------------------
  // 🔥 LOAD APPOINTMENTS (API CALL)
  // --------------------------
  loadAppointments() {
    this.doctorService
      .getPatientAsPerDoctor(this.pageNumber, this.apiPageSize, this.searchText)
      .subscribe({
        next: (response: any) => {
          console.log("API Response:", response);

          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;

          // API returns ALL → Slice for UI pagination
          const start = (this.pageNumber - 1) * this.pageSize;
          this.dataList = response.dataList.slice(start, start + this.pageSize);
        },
        error: () => this.toast.error("Failed to load appointments")
      });
  }

  // --------------------------
  // 🔥 PAGINATION
  // --------------------------
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadAppointments();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadAppointments();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadAppointments();
    }
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

  this.doctorService.getMedicineList(this.selectedMedicineType).subscribe({
    next: (res) => {
      this.medicineNames = res.dataList;   
    },
    error: () => {
      this.medicineNames = [];
    }
  });
}

loadLabTests() {
  this.doctorService.getLabTest().subscribe({
    next: (res) => {
      this.labTests = res?.dataList || [];
    },
    error: (err) => console.error("Error loading lab tests", err)
  });
}

loadMedicineOptions() {
  // Load frequencies
  this.doctorService.getMedicineFrequencies().subscribe({
    next: (res: any) => {
      this.frequencyOptions = res.dataList.map((f: any) => ({ label: f.name, value: f.id }));
    },
    error: (err) => console.error("Error loading medicine frequencies", err)
  });

  // Load timings
  this.doctorService.getMedicineTimings().subscribe({
    next: (res: any) => {
      this.timingOptions = res.dataList.map((t: any) => ({ label: t.name, value: t.name }));
    },
    error: (err) => console.error("Error loading medicine timings", err)
  });

  // Load instructions
  this.doctorService.getMedicineInstructions().subscribe({
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

  this.doctorService.savePrescription(payload).subscribe({
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
        this.doctorService.updateAppointmentStatus(appointmentId.toString(), 2).subscribe({
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
