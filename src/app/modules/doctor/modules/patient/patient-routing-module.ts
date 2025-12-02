import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddNewPatient } from './add-new-patient/add-new-patient';
import { SharedModule } from '../../../../shared/shared-module';
import { ViewTodaysPatients } from './view-todays-patients/view-todays-patients';
import { ViewAllPatients } from './view-all-patients/view-all-patients';

const routes: Routes = [
  {path: 'addpatient', component: AddNewPatient},
  {path: 'allpatient', component: ViewAllPatients},
];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [RouterModule]
})
export class PatientRoutingModule { }
