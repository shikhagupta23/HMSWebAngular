import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Hospital } from './components/hospital/hospital';
import { Users } from './components/users/users';
import { CreateFeature } from './components/create-feature/create-feature';
import { FeatureAssignment } from './components/feature-assignment/feature-assignment';
import { ChangePassword } from './components/change-password/change-password';
import { ProfileSetting } from './components/profile-setting/profile-setting';

const routes: Routes = [
   {path:'',component:Dashboard},
   {path:'hospital',component:Hospital},
    {path:'user',component:Users},
    {path:'create-feature',component: CreateFeature},
     {path:'feature-assignment',component: FeatureAssignment},
     {path:'change-password',component: ChangePassword},
     {path:'profile-setting',component: ProfileSetting},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
