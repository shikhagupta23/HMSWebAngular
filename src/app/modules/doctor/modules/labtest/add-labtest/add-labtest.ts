import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../shared/services/toast-service';

@Component({
  selector: 'app-add-labtest',
  standalone: false,
  templateUrl: './add-labtest.html',
  styleUrl: './add-labtest.scss',
})
export class AddLabtest {

  labtestForm!: FormGroup;
  private router = inject(Router);
  private toast = inject(ToastService);
  private fb =  inject(FormBuilder);
  constructor() {}

  ngOnInit() {
    this.labtestForm = this.fb.group({
      categoryType: ['', Validators.required],
      labtestName: ['', Validators.required],
      price: [''],
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.labtestForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.labtestForm.valid) {
      console.log('Labtest Data:', this.labtestForm.value);
      const savedlabtests = JSON.parse(localStorage.getItem("labtests") || "[]");
      savedlabtests.push(this.labtestForm.value);
      localStorage.setItem("labtests", JSON.stringify(savedlabtests));

      this.toast.success("Labtest Saved Successfully");
      this.labtestForm.reset();

      this.router.navigate(['/doctor/labtest/alllabtest']);
    } else {
      this.labtestForm.markAllAsTouched();
    }
  }
}


