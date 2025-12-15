import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Hospital } from './components/hospital/hospital';
import { Users } from './components/users/users';

const routes: Routes = [
   {path:'',component:Dashboard},
   {path:'hospital',component:Hospital},
    {path:'user',component:Users},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
