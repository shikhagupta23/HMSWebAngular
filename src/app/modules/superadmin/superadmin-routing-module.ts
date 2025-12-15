import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Hospital } from './components/hospital/hospital';
import { Users } from './components/users/users';
import { CreateFeature } from './components/create-feature/create-feature';

const routes: Routes = [
   {path:'',component:Dashboard},
   {path:'hospital',component:Hospital},
    {path:'user',component:Users},
    {path:'create-feature',component: CreateFeature},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
