import { Component, inject } from '@angular/core';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { AsidebarService } from './services/asidebar-service';
import { MENU_ITEMS, MenuItem } from '../../constants/menu.config';
import { MenuService } from '../../services/menu-service';

@Component({
  selector: 'app-asidebar',
  standalone: false,
  templateUrl: './asidebar.html',
  styleUrl: './asidebar.scss',
})
export class Asidebar {
  private authService = inject(AuthService);
  private asidebarService = inject(AsidebarService);
  private menuService = inject(MenuService);
  
  activeMenu: string | null = null;
  doctorDetails: any = null;
  menu:MenuItem[] = [];
  role: string='';

  ngOnInit(): void {
    this.role = this.authService.getUserRole() ?? '';
    this.menu = this.menuService.getFilteredMenu(MENU_ITEMS);
    this.loadDoctorDetails();
  }

  loadDoctorDetails(){
      const doctorId = this.authService.getLoggedInUserId();
      if(this.role?.toLowerCase() === 'doctor'){

        this.asidebarService.getDoctorDetailsById(doctorId).subscribe({
          next:(response: any) => {
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

  resolveRoute(item: MenuItem): string | readonly any[] | null | undefined {
    if (!item || !item.route) return null;
    if (typeof item.route === 'function') {
      return item.route(this.role || '');
    }
    return item.route as string | readonly any[] | null | undefined;
  }

isExactRoute(item: MenuItem): boolean {
  const route = this.resolveRoute(item);

  if (Array.isArray(route)) return false;

  return route === '/superadmin' || route === '/doctor';
}


}