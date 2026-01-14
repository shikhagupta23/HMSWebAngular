import { Component, inject } from '@angular/core';
import { RoleService } from '../../constants/role-service';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-common',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);
  showProfileMenu = false;
  role = this.auth.getUserRole();
  user$ = this.auth.user$;

  ngOnInit(): void {

  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.auth.logout();
  }
   navigateByRole(): void {
  const role = this.auth.getUserRole()?.toLowerCase();

  if (!role) {
    this.router.navigate(['/auth']);
    return;
  }

  if (role === 'doctor' || role === 'receptionist') {
    this.router.navigate(['/dashboard']);
  }
  else if (role === 'admin' || role === 'superadmin') {
    this.router.navigate(['/superadmin']);
  }
  else {
    this.router.navigate(['/']);
  }
}

}
