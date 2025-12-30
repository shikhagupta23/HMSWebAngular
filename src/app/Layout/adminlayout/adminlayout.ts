import { Component, inject } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth-service';

@Component({
  selector: 'app-adminlayout',
  standalone: false,
  templateUrl: './adminlayout.html',
  styleUrl: './adminlayout.scss',
})
export class Adminlayout {
  private auth = inject(AuthService);
 showProfileMenu = false;
role: string | null = null;
user:any
ngOnInit(): void {
 this.role= this.auth.getUserRole();
  this.user=this.auth.getUser();
}

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    this.auth.logout();
  }
}
