import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrescriptionRoutingModule } from './prescription-routing-module';
import { AddPrescription } from './add-prescription/add-prescription';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared-module';


@NgModule({
  declarations: [
    AddPrescription
  ],
  imports: [
    CommonModule,
    PrescriptionRoutingModule,
    FormsModule,
    SharedModule,
        
  ]
})
export class PrescriptionModule { }
