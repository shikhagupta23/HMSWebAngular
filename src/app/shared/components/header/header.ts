import { Component, inject } from '@angular/core';
import { RoleService } from '../../constants/role-service';
import { AuthService } from '../../../modules/auth/services/auth-service';

@Component({
  selector: 'app-header-common',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
 private auth = inject(AuthService);
 showProfileMenu = false;
role: string | null = null;
user:any
ngOnInit(): void {
 this.role= this.auth.getUserRole();
  this.user=this.auth.getUser();
  console.log(this.user,"admin layout user",this.role);
}

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.auth.logout();
  }
}
