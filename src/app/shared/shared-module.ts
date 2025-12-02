import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Addappointment } from './components/addappointment/addappointment';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Select2Directive } from './directives/select2.directive';
import { GenderPipe } from './pipe/gender-pipe';
import { Asidebar } from './components/asidebar/asidebar';

@NgModule({
  declarations: [
    Asidebar,
    Header,
    Footer,
    Addappointment,
    Select2Directive,
    GenderPipe,
    Asidebar
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule    
  ],
  exports:[ 
    Asidebar,
    Footer,
    Addappointment,
    FormsModule,
    Select2Directive,
    GenderPipe
  ]
})
export class SharedModule { }
