import { Component, inject } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth-service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private auth = inject(AuthService);
  role: string | null = null;
  isAdminOrSuperadmin: boolean = false;
  isDoctorOrReceptionist: boolean = false;
 showProfileMenu = false;
user:any

  ngOnInit(): void {
    try {
      this.role = this.auth.getUserRole();
    } catch (e) {
      this.role = null;
    }
    const r = (this.role || '').toLowerCase();
    this.isAdminOrSuperadmin = r === 'admin' || r === 'superadmin';
    this.isDoctorOrReceptionist = r === 'doctor' || r === 'receptionist';
     this.user=this.auth.getUser();
  }

 

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.auth.logout();
  }
}
