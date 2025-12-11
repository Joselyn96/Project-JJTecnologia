import { Component, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthModalComponent } from '../../../shared/components/auth-modal/auth-modal.component';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive, AuthModalComponent,RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
    // señales de estado visual
  isOpen = signal(false);
  isScrolled = signal(false);
  showUserMenu = signal(false);
  showAuthModal = signal(false);

  // constructor(private cartService: CartService) {
  //   this.cartCount = this.cartService.cartCount;
  // }

  cartCount = computed(() => this.cartService.cartCount());

  navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/products', label: 'Productos' },
    { href: '/services', label: 'Servicios' },
    { href: '/soporte', label: 'Soporte' },
    { href: '/nosotros', label: 'Nosotros' },
    { href: '/contacto', label: 'Contacto' }
  ];

constructor(
    public authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

@HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMenu() {
    this.isOpen.update(v => !v);
  }

  openAuthModal() {
    this.showAuthModal.set(true);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
  }

  async logout() {
    this.closeUserMenu(); // Cerrar el menú desplegable
    await this.authService.signOut();
    this.router.navigate(['/']); // ← AGREGAR ESTA LÍNEA
  }

  goToCart() {
  this.router.navigate(['/customer-cart']);
}

// Agregar esta propiedad
isUserMenuOpen = signal(false);

// Agregar estos métodos
toggleUserMenu() {
  this.isUserMenuOpen.update(v => !v);
}

closeUserMenu() {
  this.isUserMenuOpen.set(false);
}

// Modificar el método logout para cerrar el menú

}
