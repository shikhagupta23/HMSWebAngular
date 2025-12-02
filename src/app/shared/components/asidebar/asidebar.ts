import { Component, inject } from '@angular/core';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { AsidebarService } from './services/asidebar-service';

@Component({
  selector: 'app-asidebar',
  standalone: false,
  templateUrl: './asidebar.html',
  styleUrl: './asidebar.scss',
})
export class Asidebar {
  private authService = inject(AuthService);
  private asidebarService = inject(AsidebarService);
  activeMenu: string | null = null;
  doctorDetails: any = null;

  toggleMenu(menu: string) {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    console.log('Role:', role);
    this.loadDoctorDetails();
  }

  loadDoctorDetails(){
      const role = this.authService.getUserRole();
      const doctorId = this.authService.getLoggedInUserId();
      if(role?.toLowerCase() === 'doctor'){

        this.asidebarService.getDoctorDetailsById(doctorId).subscribe({
          next:(response: any) => {
            console.log("Doctor Details : ", response );
              if (response.isSuccess) {
                this.doctorDetails = response.data;
              }
          },
          error: (err) => {
            console.error("API Error:", err);
          }
        })
      }
    
  }

}
