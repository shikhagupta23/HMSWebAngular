import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Addappointment } from './components/addappointment/addappointment';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Select2Directive } from './directives/select2.directive';
import { GenderPipe } from './pipe/gender-pipe';
import { Asidebar } from './components/asidebar/asidebar';
import { AdminSidebar } from './components/admin-sidebar/admin-sidebar';
import { Invoice } from './components/invoice/invoice';

@NgModule({
  declarations: [
    Asidebar,
    Header,
    Footer,
    Addappointment,
    Select2Directive,
    GenderPipe,
    Asidebar,
    AdminSidebar,
    Invoice,
    
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule    
  ],
  exports:[ 
    Asidebar,
    Footer,
    Addappointment,
    FormsModule,
    Select2Directive,
    GenderPipe,
    AdminSidebar,
    Invoice
  ]
})
export class SharedModule { }
