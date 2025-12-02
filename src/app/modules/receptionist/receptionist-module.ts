import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReceptionistRoutingModule } from './receptionist-routing-module';
import { Dashboard } from './components/dashboard/dashboard';
import { Appointments } from './components/appointments/appointments';
import { Labtest } from './components/labtest/labtest';
import { Profile } from './components/profile/profile';
import { share } from 'rxjs';
import { SharedModule } from '../../shared/shared-module';


@NgModule({
  declarations: [
    Dashboard,
    Appointments,
    Labtest,
    Profile
  ],
  imports: [
    CommonModule,
    ReceptionistRoutingModule,
    SharedModule
  ]
})
export class ReceptionistModule { }
