import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MedicineRoutingModule } from './medicine-routing-module';
import { AddMedicine } from './add-medicine/add-medicine';
import { ViewMedicine } from './view-medicine/view-medicine';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared-module';

@NgModule({
  declarations: [
    AddMedicine,
    ViewMedicine
  ],
  imports: [
    CommonModule,
    MedicineRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule   
  ]
})
export class MedicineModule { }
