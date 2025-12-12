import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing-module';
import { Dashboard } from './components/dashboard/dashboard';
import { SharedModule } from '../../shared/shared-module';
import { Hospital } from './components/hospital/hospital';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    Dashboard,
    Hospital,
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
