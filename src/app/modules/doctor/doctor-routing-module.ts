import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Appointment } from './components/appointment/appointment';
import { Medicine } from './components/medicine/medicine';
import { Labtest } from './components/labtest/labtest';
import { Profile } from './components/profile/profile';
import { FormsModule } from '@angular/forms';

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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule { }
