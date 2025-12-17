import { Component, inject } from '@angular/core';
import { RoleService } from '../../constants/role-service';
import { AuthService } from '../../../modules/auth/services/auth-service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
// public roleService = inject(RoleService);
private authService = inject(AuthService);

  loggedInUserName: string = '';
  loggedInRole: string | null = null;

  ngOnInit(): void {
    const user = this.authService.getUser();   

    this.loggedInUserName = user?.userName ?? '';
    this.loggedInRole = this.authService.getUserRole();
  }

  logout() {
    this.authService.logout();
  }
}
