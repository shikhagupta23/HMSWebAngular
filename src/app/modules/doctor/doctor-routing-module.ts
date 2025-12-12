import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Appointment } from './components/appointment/appointment';
import { Medicine } from './components/medicine/medicine';
import { Labtest } from './components/labtest/labtest';
import { Profile } from './components/profile/profile';
import { FormsModule } from '@angular/forms';
import { DrugdoseComponent } from '../../shared/components/drugmanagement/drugdose/drugdose';
import { DrugAdviceComponent } from '../../shared/components/drugmanagement/drugadvice/drugadvice';
import { DrugStrengthComponent } from '../../shared/components/drugmanagement/drugstrength/drugstrength';
import { DrugTypeComponent } from '../../shared/components/drugmanagement/drugtype/drugtype';
import { DrugDurationComponent } from '../../shared/components/drugmanagement/drugduration/drugduration';
import { DrugComponent } from '../../shared/components/drugmanagement/drug/drug';

const routes: Routes = [
  {path: '', component: Dashboard},
  {path: 'medicine', component: Medicine},
  {path: 'labtest', component: Labtest},
  {path: 'profile', component: Profile},
  {path: 'appointment',
    loadChildren: () =>
    import('../doctor/modules/appointment/appointment-module').then(m => m.AppointmentModule),
  },
  {path: 'patient',
    loadChildren: () =>
    import('../doctor/modules/patient/patient-module').then(m => m.PatientModule),
  },
  {path: 'medicine',
    loadChildren: () =>
    import('../doctor/modules/medicine/medicine-module').then(m => m.MedicineModule),
  },
  {path: 'labtest',
    loadChildren: () =>
    import('../doctor/modules/labtest/labtest-module').then(m => m.LabtestModule),
  },
   {path: 'prescription',
    loadChildren: () =>
    import('../doctor/modules/prescription/prescription-module').then(m => m.PrescriptionModule),
  },
  {
    path: 'drugmanagement/drugdose',
    component: DrugdoseComponent
  },
  {
    path: 'drugmanagement/drugadvice',
    component: DrugAdviceComponent
  },
  {
    path: 'drugmanagement/drugstrength',
    component: DrugStrengthComponent
  },
  {
    path: 'drugmanagement/drugtype',
    component: DrugTypeComponent
  },
  {
    path: 'drugmanagement/drugduration',
    component: DrugDurationComponent
  },
  {
    path: 'drugmanagement/drug',
    component: DrugComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule { }
