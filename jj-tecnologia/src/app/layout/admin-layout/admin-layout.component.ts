import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
//
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RouterModule, ToastNotificationComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async handleSignOut() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  get userProfile() {
    return this.authService.userProfile();
  }

  get userInitials() {
    const profile = this.userProfile;
    if (!profile?.full_name) return 'AD';

    const names = profile.full_name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }
}
