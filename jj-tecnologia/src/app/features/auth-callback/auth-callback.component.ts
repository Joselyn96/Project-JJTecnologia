import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
   constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
   console.log('🔍 Callback URL:', window.location.href);
  console.log('🔍 1. Callback iniciado');
    
    try {
      // Supabase procesa automáticamente el token de la URL
      const { data } = await this.authService.client.auth.getSession();
      
      console.log('🔍 2. Sesión obtenida:', data);
      
      if (data.session) {
        console.log('🔍 3. Usuario autenticado:', data.session.user);
        
        // Usuario autenticado exitosamente
        await this.authService.loadUserProfile(data.session.user.id);
        
        console.log('🔍 4. Perfil cargado:', this.authService.userProfile());
        
        // Actualizar el estado de autenticación
        this.authService.isAuthenticated.set(true);
        this.authService.currentUser.set(data.session.user);
        
        // Redirigir según el rol
        const userRole = this.authService.userProfile()?.role_id;
        
        console.log('🔍 5. Role del usuario:', userRole);
        
        if (userRole === 1) {
          console.log('🔍 6. Redirigiendo a /admin');
          this.router.navigate(['/admin']);
        } else {
          console.log('🔍 6. Redirigiendo a /');
          this.router.navigate(['/']);
        }
      } else {
        console.log('❌ No hay sesión');
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('❌ Error en callback:', error);
      this.router.navigate(['/']);
    }
  }
}
