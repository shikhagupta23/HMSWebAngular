import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddMedicine } from './add-medicine/add-medicine';
import { ViewMedicine } from './view-medicine/view-medicine';
import { SharedModule } from '../../../../shared/shared-module';

const routes: Routes = [
  {path: 'addmedicine', component: AddMedicine},
  {path: 'allmedicine', component: ViewMedicine},
];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [RouterModule]
})
export class MedicineRoutingModule { }
