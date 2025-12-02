import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './components/login/login';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    Login,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
  
  ]
})
export class AuthModule { }
