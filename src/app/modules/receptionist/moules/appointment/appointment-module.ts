import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentRoutingModule } from './appointment-routing-module';
import { Todayappointments } from './todayappointments/todayappointments';
import { Upcomingappointment } from './upcomingappointment/upcomingappointment';
import { Pastappointments } from './pastappointments/pastappointments';
import { Followupappointments } from './followupappointments/followupappointments';
import { SharedModule } from '../../../../shared/shared-module';


@NgModule({
  declarations: [
    Todayappointments,
    Upcomingappointment,
    Pastappointments,
    Followupappointments
  ],
  imports: [
    CommonModule,
    AppointmentRoutingModule,
    SharedModule
  ]
})
export class AppointmentModule { }
