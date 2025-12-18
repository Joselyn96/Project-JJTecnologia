import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';;
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que se cargue la sesión si aún no está lista
  if (!authService.isAuthenticated()) {
    await authService.checkSession();
  }

  const userRole = authService.userProfile()?.role_id;

  // Si la ruta es /admin/* y ES admin → permitir
  if (state.url.startsWith('/admin')) {
    if (userRole === 1) {
      return true;
    }
    router.navigate(['/']);
    return false;
  }

  // Si la ruta NO es /admin y ES admin → bloquear y redirigir a /admin
  if (userRole === 1) {
    router.navigate(['/admin']);
    return false;
  }

  // Usuario normal puede acceder
  return true;
};
