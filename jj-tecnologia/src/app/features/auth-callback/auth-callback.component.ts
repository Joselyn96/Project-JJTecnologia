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
  errorMsg = '';
   constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
   console.log('Callback iniciado');
  console.log('URL completa:', window.location.href);
  console.log('Hash:', window.location.hash);
  
  try {
    // Supabase procesa automáticamente desde el hash
    const { data, error } = await this.authService.client.auth.getSession();
    
    console.log('Sesión:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error(' Error:', error);
      this.errorMsg = error.message;
      setTimeout(() => this.router.navigate(['/']), 3000);
      return;
    }
    
    if (data.session) {
      console.log('Sesión válida');
      
      await this.authService.loadUserProfile(data.session.user.id);
      this.authService.isAuthenticated.set(true);
      this.authService.currentUser.set(data.session.user);
      
      const userRole = this.authService.userProfile()?.role_id;
      
      if (userRole === 1) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      console.log('No hay sesión después del callback');
      this.errorMsg = 'No se detectó sesión';
      setTimeout(() => this.router.navigate(['/']), 3000);
    }
  } catch (error: any) {
    console.error('Error:', error);
    this.errorMsg = error.message;
    setTimeout(() => this.router.navigate(['/']), 3000);
  }
  }
}
