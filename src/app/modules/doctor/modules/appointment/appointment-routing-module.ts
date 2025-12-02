import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewTodaysAppointments } from './view-todays-appointments/view-todays-appointments';
import { ViewPastAppointments } from './view-past-appointments/view-past-appointments';
import { ViewFollowupAppointments } from './view-followup-appointments/view-followup-appointments';
import { ViewUpcomingAppointments } from './view-upcoming-appointments/view-upcoming-appointments';
import { FormsModule } from '@angular/forms';
import { AddAppointment } from './add-appointment/add-appointment';

const routes: Routes = [
  {path: 'todayappointments', component:ViewTodaysAppointments},
  {path: 'pastappointments', component:ViewPastAppointments},
  {path: 'followupappointments', component:ViewFollowupAppointments},
  {path: 'upcomingappointments', component:ViewUpcomingAppointments},
  {path: 'addappointment', component:AddAppointment},
];

@NgModule({
  imports: [RouterModule.forChild(routes), FormsModule],
  exports: [RouterModule]
})
export class AppointmentRoutingModule { }
