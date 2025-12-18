import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';


@Component({
  selector: 'app-auth-modal',
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.css'
})
export class AuthModalComponent {
  isOpen = signal(true);
  isLogin = signal(true);
  fullName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
passwordVisible = false;
confirmPasswordVisible = false;
  close = output<void>();

  constructor(private authService: AuthService, private router: Router) { }

  toggleMode() {
    this.isLogin.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.fullName.set('');
    this.email.set('');
    this.password.set('');
    this.confirmPassword.set('');
  }

  handleClose() {
    this.close.emit();
  }

 async handleSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    try {
      if (this.isLogin()) {
        // LOGIN
        await this.authService.signIn(this.email(), this.password());
        
        const userRole = this.authService.userProfile()?.role_id;
        
        if (userRole === 1) {
          // Administrador
          this.successMessage.set('¡Bienvenido Administrador!');
          setTimeout(() => {
            this.close.emit();
            this.router.navigate(['/admin']);
          }, 1000);
        } else {
          // Cliente - se queda en la misma página
          this.successMessage.set('¡Bienvenido!');
          setTimeout(() => {
            this.close.emit();
          }, 1000);
        }
        
      } else {
        // REGISTER
        if (!this.fullName().trim()) {
          this.errorMessage.set('El nombre completo es requerido');
          this.isLoading.set(false);
          return;
        }

        if (this.password().length < 6) {
          this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
          this.isLoading.set(false);
          return;
        }

        if (this.password() !== this.confirmPassword()) {
          this.errorMessage.set('Las contraseñas no coinciden');
          this.isLoading.set(false);
          return;
        }

        await this.authService.signUp(this.email(), this.password(), this.fullName());
        this.successMessage.set('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');

        setTimeout(() => {
          this.isLogin.set(true);
          this.successMessage.set('');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      this.errorMessage.set(error.message || 'Ocurrió un error');
    } finally {
      this.isLoading.set(false);
    }
  }
  // ========================================
  // NUEVO: LOGIN CON GOOGLE
  // ========================================
  async loginWithGoogle() {
    this.errorMessage.set('');
  this.isLoading.set(true);

  try {
    const { data, error } = await this.authService.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      this.errorMessage.set('Error al iniciar sesión con Google');
      console.error('Error Google OAuth:', error);
      this.isLoading.set(false);
      return;
    }

    // El usuario será redirigido a Google automáticamente
  } catch (error: any) {
    this.errorMessage.set('Error inesperado al conectar con Google');
    console.error('Error inesperado:', error);
    this.isLoading.set(false);
  }
  }
  async signInWithGoogle() {
  try {
    await this.authService.signInWithGoogle();
    // El usuario será redirigido a Google y luego a /auth/callback
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    alert('Error al iniciar sesión con Google');
  }
}
}
