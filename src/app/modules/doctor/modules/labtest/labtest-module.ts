import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LabtestRoutingModule } from './labtest-routing-module';
import { AddLabtest } from './add-labtest/add-labtest';
import { ViewLabtest } from './view-labtest/view-labtest';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared-module';


@NgModule({
  declarations: [
    AddLabtest,
    ViewLabtest
  ],
  imports: [
    CommonModule,
    LabtestRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class LabtestModule { }
