import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing-module';
import { Dashboard } from './components/dashboard/dashboard';
import { SharedModule } from '../../shared/shared-module';
import { Hospital } from './components/hospital/hospital';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Users } from './components/users/users';
import { CreateFeature } from './components/create-feature/create-feature';
import { FeatureAssignment } from './components/feature-assignment/feature-assignment';
import { ChangePassword } from './components/change-password/change-password';
import { ProfileSetting } from './components/profile-setting/profile-setting';
import { UpcomingFollowup } from './components/upcoming-followup/upcoming-followup';
import { LabtestComponent } from './components/labtest/labtest';
import { PrintSettingComponent } from './components/print-setting/print-setting';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HospitalDetails } from './components/hospital-details/hospital-details';
import { Package } from './components/package/package';
import { AssignPackage } from './components/assign-package/assign-package';
import { PrescriptionHelperValues } from '../doctor/modules/prescription/prescription-helper-values/prescription-helper-values';
@NgModule({
  declarations: [
    Dashboard,
    Hospital,
    Users,
    CreateFeature,
    FeatureAssignment,
    ChangePassword,
    ProfileSetting,
    UpcomingFollowup,
    LabtestComponent,
    PrintSettingComponent,
    HospitalDetails,
    Package,
    AssignPackage,
    PrescriptionHelperValues
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMaterialIntlTelInputComponent,
    MatSelectModule,
    MatIconModule,
    
  ]
})
export class SuperadminModule { }
