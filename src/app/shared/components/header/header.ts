import { Component, inject } from '@angular/core';
import { RoleService } from '../../constants/role-service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
public roleService = inject(RoleService);
}
