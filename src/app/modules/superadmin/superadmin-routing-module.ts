import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Hospital } from './components/hospital/hospital';
import { Users } from './components/users/users';
import { CreateFeature } from './components/create-feature/create-feature';
import { FeatureAssignment } from './components/feature-assignment/feature-assignment';
import { ChangePassword } from './components/change-password/change-password';
import { ProfileSetting } from './components/profile-setting/profile-setting';
import { UpcomingFollowup } from './components/upcoming-followup/upcoming-followup';
import { LabtestComponent } from '../superadmin/components/labtest/labtest';
import { PrintSettingComponent } from './components/print-setting/print-setting';
import { HospitalDetails } from './components/hospital-details/hospital-details';

const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'hospital', component: Hospital },
  { path: 'user', component: Users },
  { path: 'create-feature', component: CreateFeature },
  { path: 'feature-assignment', component: FeatureAssignment },
  { path: 'change-password', component: ChangePassword },
  { path: 'profile-setting', component: ProfileSetting },
  { path: 'upcoming-followup', component: UpcomingFollowup },
  { path: 'labtest', component: LabtestComponent },
  { path: 'print-setting', component: PrintSettingComponent },
  {path: 'hospital-details/:hospitalName', component: HospitalDetails}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminRoutingModule {}
