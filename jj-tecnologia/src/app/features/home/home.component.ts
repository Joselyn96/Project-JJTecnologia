import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { DecimalPipe } from '@angular/common';

type BadgeVariant = 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, ButtonComponent, CardComponent, BadgeComponent, CurrencyPipe, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
   readonly icons = {
    arrowRight: 'arrow_forward',
    wifi: 'wifi',
    wrench: 'build',
    shield: 'shield',
    zap: 'bolt',
  };

  services = [
    { icon: this.icons.wifi,   title: 'Instalación de Cámaras',  description: 'Monitoreo remoto desde tu celular o PC con sistemas CCTV/IP profesionales.' },
    { icon: this.icons.wrench, title: 'Soporte & Mantenimiento', description: 'Diagnóstico, limpieza y reemplazo de partes para tu equipo.' },
    { icon: this.icons.shield, title: 'Cableado Estructurado',   description: 'Redes seguras y escalables para tu empresa con garantía.' },
    { icon: this.icons.zap,    title: 'Desarrollo Web',          description: 'Soluciones web personalizadas para tu negocio digital.' },
  ];

  products = [
    { id: '1', name: 'Laptop ASUS VivoBook',  price: 2499, image: 'LaptopASUSVivoBook.jpg', stock: 5,  badge: 'En stock' },
    { id: '2', name: 'PC Gamer Lenovo',       price: 3999, image: 'PCGamerLenovo.jpg',                 stock: 3,  badge: 'Bajo stock' },
    { id: '3', name: 'Impresora HP LaserJet', price: 1299, image: 'ImpresoraHPLaserJet.jpg',                stock: 8,  badge: 'En stock' },
    { id: '4', name: 'Cámara CCTV Dahua',     price: 599,  image: 'CamaraCCTVDahua.png',              stock: 12, badge: 'En stock' },
    { id: '5', name: 'Monitor Samsung 27"',   price: 899,  image: 'MonitorSamsung27.png',         stock: 0,  badge: 'Agotado' },
    { id: '6', name: 'Teclado Mecánico RGB',  price: 349,  image: 'TecladoMecanicoRGB.jpg',                  stock: 15, badge: 'En stock' },
  ];

  brands = ['Samsung', 'Lenovo', 'ASUS', 'Acer', 'Toshiba', 'Dahua', 'Hikvision', 'HP'];

  // 👇 ESTA PROPIEDAD FALTABA
  testimonials = [
    {
      name: 'Carlos Mendoza',
      company: 'Empresa XYZ',
      text: 'Excelente servicio y productos de calidad. El equipo de JJ Tecnología es muy profesional.',
    },
    {
      name: 'María García',
      company: 'Hogar',
      text: 'Muy satisfecha con la instalación de cámaras. Recomiendo ampliamente sus servicios.',
    },
  ];

  variantFor(stock: number): BadgeVariant {
    if (stock === 0) return 'danger';
    if (stock <= 5) return 'warning';
    return 'success';
  }
}
