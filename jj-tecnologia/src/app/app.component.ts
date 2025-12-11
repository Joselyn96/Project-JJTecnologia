import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'jj-tecnologia';
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);


  ngOnInit() {
    // Verificar sesión al cargar la aplicación
    console.log('🔍 App iniciada, verificando sesión...');
    this.authService.checkSession();
    this.setupChatbotVisibility();
  }

  private setupChatbotVisibility() {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) return;

    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.toggleChatbot();
      });

    // Verificar ruta inicial
    setTimeout(() => this.toggleChatbot(), 500);
  }

  private toggleChatbot() {
    const currentUrl = this.router.url;
    const isAdminRoute = currentUrl.startsWith('/admin');
    
    const messenger = document.querySelector('df-messenger') as HTMLElement;
    
    if (messenger) {
      messenger.style.display = isAdminRoute ? 'none' : 'block';
    }
  }
}
