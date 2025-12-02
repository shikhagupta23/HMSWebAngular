import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorRoutingModule } from './doctor-routing-module';
import { Dashboard } from './components/dashboard/dashboard';
import { Appointment } from './components/appointment/appointment';
import { Medicine } from './components/medicine/medicine';
import { Labtest } from './components/labtest/labtest';
import { Profile } from './components/profile/profile';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { SharedModule } from '../../shared/shared-module';
import { FormsModule } from '@angular/forms';
import { PrescriptionModule } from './modules/prescription/prescription-module';
import { AddAppointment } from './modules/appointment/add-appointment/add-appointment';
import { AddPrescription } from './modules/prescription/add-prescription/add-prescription';



@NgModule({
  declarations: [
    Dashboard,
    Appointment,
    Medicine,
    Labtest,
    Profile,
    Header,
    Footer
  ],
  imports: [
    CommonModule,
    DoctorRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class DoctorModule { }
