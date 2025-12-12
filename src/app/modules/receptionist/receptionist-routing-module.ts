import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Appointments } from './components/appointments/appointments';
import { Labtest } from './components/labtest/labtest';
import { profile } from 'console';
import { Profile } from './components/profile/profile';
import { DrugdoseComponent } from '../../shared/components/drugmanagement/drugdose/drugdose';

const routes: Routes = [
  {path:'',component:Dashboard},
  {path:'appointment',component:Appointments},
  {path:'labtest',component:Labtest},
  {path:'profile',component:Profile},
  {
    path: 'drugmanagement/drugdose',
    component: DrugdoseComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReceptionistRoutingModule { }
