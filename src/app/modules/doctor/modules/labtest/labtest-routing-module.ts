import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddLabtest } from './add-labtest/add-labtest';
import { ViewLabtest } from './view-labtest/view-labtest';
import { SharedModule } from '../../../../shared/shared-module';

const routes: Routes = [
  {path:'addlabtest', component: AddLabtest},
  {path:'alllabtest', component: ViewLabtest},
];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [RouterModule]
})
export class LabtestRoutingModule { }
