import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientRoutingModule } from './patient-routing-module';
import { ViewTodaysPatients } from './view-todays-patients/view-todays-patients';
import { ViewAllPatients } from './view-all-patients/view-all-patients';
import { AddNewPatient } from './add-new-patient/add-new-patient';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared-module';


@NgModule({
  declarations: [
    ViewTodaysPatients,
    ViewAllPatients,
    AddNewPatient
  ],
  imports: [
    CommonModule,
    PatientRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule
  ]
})
export class PatientModule { }
