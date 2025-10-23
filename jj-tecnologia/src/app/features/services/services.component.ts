import { Component,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

type IconKey = 'wifi' | 'wrench' | 'shield' | 'code' | 'clock' | 'users';
interface ServiceItem {
  icon: IconKey;
  title: string;
  description: string;
  features: string[];
  price: string;
  duration: string;
}

interface WhyItem {
  icon: IconKey;
  title: string;
  description: string;
}
@Component({
  selector: 'app-services',
  imports: [CommonModule, NavbarComponent, CardComponent, ButtonComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  services = signal<ServiceItem[]>([
    {
      icon: 'wifi',
      title: 'Instalación de Cámaras CCTV/IP',
      description: 'Sistemas de vigilancia profesionales con monitoreo remoto desde tu celular o PC.',
      features: ['Instalación profesional', 'Monitoreo 24/7', 'Soporte técnico', 'Garantía 2 años'],
      price: 'Desde S/ 500',
      duration: '2-4 horas',
    },
    {
      icon: 'wrench',
      title: 'Mantenimiento de PCs y Laptops',
      description: 'Diagnóstico, limpieza, optimización y reemplazo de componentes.',
      features: ['Diagnóstico gratis', 'Limpieza profunda', 'Optimización', 'Reemplazo de partes'],
      price: 'Desde S/ 150',
      duration: '1-2 horas',
    },
    {
      icon: 'shield',
      title: 'Configuración de Redes y Cableado',
      description: 'Redes seguras, escalables y de alto rendimiento para empresas.',
      features: ['Diseño de red', 'Instalación', 'Configuración', 'Capacitación'],
      price: 'Desde S/ 800',
      duration: 'Según proyecto',
    },
    {
      icon: 'code',
      title: 'Desarrollo Web Personalizado',
      description: 'Sitios web y aplicaciones a medida para tu negocio digital.',
      features: ['Diseño responsivo', 'SEO optimizado', 'Mantenimiento', 'Soporte'],
      price: 'Consultar',
      duration: 'Según proyecto',
    },
  ]);

  whyItems = signal<WhyItem[]>([
    { icon: 'users', title: 'Equipo Profesional', description: 'Técnicos certificados con años de experiencia.' },
    { icon: 'clock', title: 'Respuesta Rápida', description: 'Atendemos en 24 horas o menos.' },
    { icon: 'shield', title: 'Garantía Completa', description: 'Todos nuestros servicios incluyen garantía.' },
  ]);

  iconLabel(key: IconKey): string {
    switch (key) {
      case 'wifi': return 'CCTV/IP';
      case 'wrench': return 'Mantenimiento';
      case 'shield': return 'Seguridad';
      case 'code': return 'Desarrollo';
      case 'clock': return 'Rápido';
      case 'users': return 'Equipo';
    }
  }
}
