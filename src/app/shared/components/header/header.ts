import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { Router } from '@angular/router';
import { environment } from '../../../../environment/environment';

@Component({
  selector: 'app-header-common',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  showProfileMenu = false;
  role = this.auth.getUserRole();
  user$ = this.auth.user$;
  todayLabel = '';
  readonly defaultAvatar = 'assets/img/icons/user-circle.svg';

  ngOnInit(): void {
    this.todayLabel = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'long',
    }).format(new Date());
  }

  get welcomeSubtitle(): string {
    const role = (this.role || '').toLowerCase();
    if (role === 'doctor') return "Here's what's happening in your clinic today.";
    if (role === 'receptionist') return "Here's what's happening at the front desk today.";
    if (role === 'admin') return "Here's your hospital overview for today.";
    if (role === 'superadmin') return "Here's your platform overview for today.";
    return "Here's what's happening today.";
  }

  avatarUrl(user: any): string | null {
    const img = user?.hospitalImage || user?.profileImage || user?.userImage;
    if (!img) return null;
    if (String(img).startsWith('http')) return img;
    const base =
      (environment as any).hospitalLogoPath ||
      'https://www.api.medipilot360.com/hospitalLogo/';
    return `${base}${img}`;
  }

  initials(user: any): string {
    const name = (user?.userName || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img && img.src !== this.defaultAvatar) {
      img.src = this.defaultAvatar;
    }
  }

  toggleProfileMenu(event?: Event) {
    event?.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.showProfileMenu = false;
    }
  }

  logout() {
    this.showProfileMenu = false;
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
    } else if (role === 'admin' || role === 'superadmin') {
      this.router.navigate(['/superadmin']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
