import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { MENU_ITEMS, MenuItem } from '../../constants/menu.config';
import { AsidebarService } from '../asidebar/services/asidebar-service';
import { MenuService } from '../../services/menu-service';
import { ClinicalFormsAccessService } from '../../../modules/doctor/modules/clinical-forms/services/clinical-forms-access-service';
@Component({
  selector: 'app-admin-sidebar',
  standalone: false,
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  private authService = inject(AuthService);
  private asidebarService = inject(AsidebarService);
  private menuService = inject(MenuService);
  private clinicalFormsAccess = inject(ClinicalFormsAccessService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  activeMenu: string | null = null;
  doctorDetails: any = null;
  menu:MenuItem[] = [];
  role: string='';
  userName = '';

  get userInitials(): string {
    const name = (this.userName || this.role || 'U').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  ngOnInit(): void {
    this.role = this.authService.getUserRole() ?? '';
    this.userName = this.authService.currentUser?.userName ?? '';
    this.menu = this.menuService.getFilteredMenu(MENU_ITEMS);
    this.loadDoctorDetails();

    // Clinical Forms visibility is verified by the server; refresh the menu once it is known.
    this.clinicalFormsAccess.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.menu = this.menuService.getFilteredMenu(MENU_ITEMS);
      this.cdr.markForCheck();
    });
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

  // If route is an array → never exact
  if (Array.isArray(route)) return false;

  // Exact only for dashboard routes
  return route === '/superadmin' || route === '/doctor';
}



}
