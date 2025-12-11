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

  if (authService.isAuthenticated() && userRole === 1) {
    return true;
  }

  // Si no es admin, redirigir a home
  router.navigate(['/']);
  return false;
};
