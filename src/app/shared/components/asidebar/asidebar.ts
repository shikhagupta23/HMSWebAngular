import { Component, inject } from '@angular/core';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { AsidebarService } from './services/asidebar-service';
import { MENU_ITEMS, MenuItem } from '../../constants/menu.config';

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
  menu:MenuItem[] = [];
  role: string='';
  ngOnInit(): void {
    this.role = this.authService.getUserRole() ?? '';
    this.menu = MENU_ITEMS.filter(m => m.roles.includes(this.role));
    this.loadDoctorDetails();
  }

  loadDoctorDetails(){
      const doctorId = this.authService.getLoggedInUserId();
      if(this.role?.toLowerCase() === 'doctor'){

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
  handleMenuAction(action: string) {
    
  if (action === 'logout') {
    this.authService.logout();
  }
}
}
