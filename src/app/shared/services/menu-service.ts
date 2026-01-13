import { Injectable } from "@angular/core";
import { AuthService } from "../../modules/auth/services/auth-service";
import { MenuItem } from "../constants/menu.config";

@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private auth: AuthService) {}

  getFilteredMenu(menu: MenuItem[]): MenuItem[] {
    return menu
      .filter(item => this.canShow(item))
      .map(item => ({
        ...item,
        children: item.children
          ? item.children.filter(child => this.canShow(child))
          : undefined
      }));
  }

private canShow(item: MenuItem): boolean {
  const role = (this.auth.role ?? '').toLowerCase();

  // 🔥 FEATURE ASSIGNMENT SPECIAL CASE
  if (item.route === '/superadmin/feature-assignment') {
    if (role === 'superadmin') return true;
    if (role === 'admin') {
      return this.auth.hasAnyExtendableFeature();
    }
    return false;
  }

  // Role-based filtering
  if (
    item.roles?.length &&
    !item.roles.map(r => r.toLowerCase()).includes(role)
  ) {
    return false;
  }

  // Feature-based filtering
  if (item.featureKey && !this.auth.hasFeature(item.featureKey)) {
    return false;
  }

  return true;
}


}
