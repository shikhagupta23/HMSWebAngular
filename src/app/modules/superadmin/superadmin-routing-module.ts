import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Hospital } from './components/hospital/hospital';
import { Users } from './components/users/users';
import { CreateFeature } from './components/create-feature/create-feature';
import { FeatureAssignment } from './components/feature-assignment/feature-assignment';

const routes: Routes = [
   {path:'',component:Dashboard},
   {path:'hospital',component:Hospital},
    {path:'user',component:Users},
    {path:'create-feature',component: CreateFeature},
     {path:'feature-assignment',component: FeatureAssignment},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
