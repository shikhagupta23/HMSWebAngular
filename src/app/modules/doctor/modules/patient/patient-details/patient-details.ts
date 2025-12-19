import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { PatientService } from '../services/patient-service'; // adjust path

@Component({
  selector: 'app-patient-details',
  standalone: false,
  templateUrl: './patient-details.html',
  styleUrl: './patient-details.scss',
})
export class PatientDetails implements OnInit {

  patientId!: number;
  patient: any;
  appointments: any[] = [];
  lastBookingDate?: string;

  page: number = 1;
  pageSize: number = 20;

  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private patientService = inject(PatientService);

  ngOnInit(): void {

    const nav = history.state;
    if (nav?.patient) {
      this.patient = nav.patient;
    }
    console.log(this.patient);
    this.patientId = this.patient.userId;
    console.log(this.patientId);

    this.loadPatientAppointmentLists();
  }

loadPatientAppointmentLists() {
  this.patientService
    .getPatientAppointmentLists(this.patientId, this.page, this.pageSize)
    .subscribe({
      next: (res) => {
        this.appointments = res?.dataList || [];
        this.lastBookingDate = this.appointments[0]?.appointmentDate;
        console.log('Appointments:', this.appointments);
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
      }
    });
}


  goBack() {
    this.location.back();
  }
}
