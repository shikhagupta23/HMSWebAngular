import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLayout } from './Layout/auth-layout/auth-layout';
import { MainLayout } from './Layout/main-layout/main-layout';
import { authGuard } from './shared/guards/auth.guard';
import { Dashboard } from './shared/components/dashboard/dashboard';

const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  // AUTH LAYOUT (NO HEADER/FOOTER)
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./modules/auth/auth-module').then((m) => m.AuthModule),
      },
    ],
  },

  // MAIN LAYOUT (WITH HEADER/FOOTER)
  { 
    path: '',
    canActivate: [authGuard],
    component: MainLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./modules/doctor/doctor-module').then((m) => m.DoctorModule),
      },
      // {
      //   path: 'receptionist',
      //   loadChildren: () =>
      //     import('./modules/doctor/doctor-module').then(
      //       (m) => m.DoctorModule
      //     ),
      // },
       {
        path: 'superadmin',
        loadChildren: () =>
          import('./modules/superadmin/superadmin-module').then(
            (m) => m.SuperadminModule
          ),
      },
    ],
  },
  {
    path:'dashboard',
    component:Dashboard,
     canActivate: [authGuard],
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
