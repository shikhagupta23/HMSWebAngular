import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-patient-details',
  standalone: false,
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.scss',
})
export class PatientDetails implements OnInit {

    patientId!: number;
  patient: any;

  private route = inject(ActivatedRoute);
  private location = inject(Location);

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPatientDetails();
  }

    loadPatientDetails() {
    // 🔹 STATIC DATA NOW (API LATER)
    this.patient = {
      patientViewId: 'P0016',
      fullName: 'Adrian Marshall',
      age: 42,
      gender: 'Male',
      bloodGroup: 'AB+ve',
      lastBooking: '24 Mar 2024'
    };
  }

  goBack() {
    this.location.back(); 
  }
}
