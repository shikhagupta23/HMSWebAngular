import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Todayappointments } from './todayappointments/todayappointments';
import { Pastappointments } from './pastappointments/pastappointments';
import { Followupappointments } from './followupappointments/followupappointments';
import { Upcomingappointment } from './upcomingappointment/upcomingappointment';

const routes: Routes = [  
  {path: 'appointment/todayappointments', component:Todayappointments},
  {path: 'appointment/pastappointments', component:Pastappointments},
  {path: 'appointment/followupappointments', component:Followupappointments},
  {path: 'appointment/upcomingappointments', component:Upcomingappointment},];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentRoutingModule { }
