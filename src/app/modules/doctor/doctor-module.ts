import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorRoutingModule } from './doctor-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { FormsModule } from '@angular/forms';
import { PrescriptionModule } from './modules/prescription/prescription-module';
import { AddAppointment } from './modules/appointment/add-appointment/add-appointment';
import { AddPrescription } from './modules/prescription/add-prescription/add-prescription';
import { GenderPipe } from '../../shared/pipe/gender-pipe';
import { DrugdoseComponent } from '../../shared/components/drugmanagement/drugdose/drugdose';
import { DrugAdviceComponent } from '../../shared/components/drugmanagement/drugadvice/drugadvice';
import { DrugStrengthComponent } from '../../shared/components/drugmanagement/drugstrength/drugstrength';
import { DrugTypeComponent } from '../../shared/components/drugmanagement/drugtype/drugtype';
import { DrugDurationComponent } from '../../shared/components/drugmanagement/drugduration/drugduration';
import { DrugComponent } from '../../shared/components/drugmanagement/drug/drug';



@NgModule({
  declarations: [
    DrugdoseComponent,
    DrugAdviceComponent,
    DrugStrengthComponent,
    DrugTypeComponent,
    DrugDurationComponent,
    DrugComponent
  ],
  imports: [
    CommonModule,
    DoctorRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class DoctorModule { }
