import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing-module';
import { Dashboard } from './components/dashboard/dashboard';
import { SharedModule } from '../../shared/shared-module';
import { Hospital } from './components/hospital/hospital';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Users } from './components/users/users';
import { Features } from './components/features/features';


@NgModule({
  declarations: [
    Dashboard,
    Hospital,
    Users,
    Features,
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule

  ]
})
export class SuperadminModule { }
