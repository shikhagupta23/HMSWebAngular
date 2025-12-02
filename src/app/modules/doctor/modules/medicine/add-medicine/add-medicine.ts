
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../../../../shared/services/toast-service';
import { Router } from '@angular/router';
import { MedicineService } from '../Services/medicine-sevice';

@Component({
  selector: 'app-add-medicine',
  standalone: false,
  templateUrl: './add-medicine.html',
  styleUrls: ['./add-medicine.scss']
})
export class AddMedicine implements OnInit {

  medicineForm!: FormGroup;
  private router = inject(Router);
  private toast = inject(ToastService);
  private fb =  inject(FormBuilder);
  private medicineService = inject(MedicineService);
  searchTerm : string = "";
  medicineTypes: any[] = [];


  constructor() {}

  ngOnInit() {
    this.medicineForm = this.fb.group({
      medicineType: ['', Validators.required],
      medicineName: ['', Validators.required],
      manufacturerName: [''],
      quantity: ['']
    });
    this.loadMedicineType();
  } 

  loadMedicineType(){
      this.medicineService.getMedicineType(this.searchTerm).subscribe({
        next:(response:any) =>{
          console.log(response);
          this.medicineTypes = response.dataList || [];

        },
        error: (err) => {
          console.error("Error loading medicine type:", err);
        }
      })
  }

  isInvalid(controlName: string): boolean {
    const control = this.medicineForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.medicineForm.invalid) {
      this.medicineForm.markAllAsTouched();
      return;
    }

    const payload = {
        medicineName: this.medicineForm.value.medicineName,
        manufacturer: this.medicineForm.value.manufacturerName,
        unit: String(this.medicineForm.value.quantity),
        medicineType: this.medicineForm.value.medicineType
    };
    console.log(payload);
    this.medicineService.postMedicine(payload).subscribe({
      next: (res) => {
        this.toast.success("Medicine Saved Successfully");
        this.medicineForm.reset();

        this.router.navigate(['/doctor/medicine/allmedicine']);
      },
      error: (err) => {
        console.error(err);
        console.log("Validation errors:", err.error?.errors);  
        this.toast.error("Something went wrong");
      }
    });
  }
}

