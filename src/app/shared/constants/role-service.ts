import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RoleService {

  getRole(): string {
    return localStorage.getItem("role")?.toLowerCase() || "";
  }

  isDoctor(): boolean {
    return this.getRole() === "doctor";
  }

  isReceptionist(): boolean {
    return this.getRole() === "receptionist";
  }

  isAdmin(): boolean {
    return this.getRole() === "admin" || this.getRole() === "superadmin";
  }
}
