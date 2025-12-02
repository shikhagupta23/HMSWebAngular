import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentRoutingModule } from './appointment-routing-module';
import { ViewTodaysAppointments } from './view-todays-appointments/view-todays-appointments';
import { ViewPastAppointments } from './view-past-appointments/view-past-appointments';
import { SharedModule } from '../../../../shared/shared-module';
import { ViewUpcomingAppointments } from './view-upcoming-appointments/view-upcoming-appointments';
import { ViewFollowupAppointments } from './view-followup-appointments/view-followup-appointments';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddAppointment } from './add-appointment/add-appointment';


@NgModule({
  declarations: [
    ViewTodaysAppointments,
    ViewPastAppointments,
    ViewUpcomingAppointments,
    ViewFollowupAppointments,
    AddAppointment
  ],
  imports: [
    CommonModule,
    AppointmentRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AppointmentModule { }
