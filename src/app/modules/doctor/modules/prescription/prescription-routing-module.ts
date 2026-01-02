import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddPrescription } from './add-prescription/add-prescription';
import { PrescriptionHelperValues } from './prescription-helper-values/prescription-helper-values';


const routes: Routes = [
  {path: 'add', component: AddPrescription},
  {path: 'prescriptionhelepervalues', component: PrescriptionHelperValues},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrescriptionRoutingModule { }
