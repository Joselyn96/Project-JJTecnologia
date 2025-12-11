import { Component, signal } from '@angular/core';
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
  standalone: true,
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

  // ====== MODAL STATE ======
  isModalOpen = signal(false);
  modalStep = signal<1 | 2>(1);
  selectedService = signal<ServiceItem | null>(null);

  // Form fields
  date = signal<string>('');
  time = signal<string>('');
  name = signal<string>('');
  phone = signal<string>('');
  address = signal<string>('');
  notes = signal<string>('');
  isSubmitted = signal(false); // ← AGREGAR ESTA LÍNEA
  

  hours: string[] = ['09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];

  // ====== MÉTODOS PARA MANEJAR CAMBIOS DE INPUTS ======
  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.date.set(value);
  }

  onTimeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.time.set(value);
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.name.set(value);
  }

  onPhoneChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.phone.set(value);
  }

  onAddressChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.address.set(value);
  }

  onNotesChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.notes.set(value);
  }

  // ====== MÉTODOS DEL MODAL ======
  openModal(service: ServiceItem) {
    this.selectedService.set(service);
    this.isModalOpen.set(true);
    this.modalStep.set(1);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedService.set(null);
  this.modalStep.set(1);
  this.date.set('');
  this.time.set('');
  this.name.set('');
  this.phone.set('');
  this.address.set('');
  this.notes.set('');
  this.isSubmitted.set(false); // ← AGREGAR ESTA LÍNEA
  }

  nextStep() {
    if (!this.date() || !this.time()) return;
    this.modalStep.set(2);
  }

  prevStep() {
    this.modalStep.set(1);
  }

  submitRequest() {
    // Aquí integras API/Email/WhatsApp
    console.log('Solicitud:', {
      service: this.selectedService()?.title,
      date: this.date(),
      time: this.time(),
      name: this.name(),
      phone: this.phone(),
      address: this.address(),
      notes: this.notes(),
    });

    // (Opcional) reset
    
    // this.date.set(''); 
    // this.time.set(''); 
    // this.name.set('');
    // this.phone.set(''); 
    // this.address.set(''); 
    // this.notes.set('');
    this.isSubmitted.set(true); // ← CAMBIAR ESTA LÍNEA (antes era this.closeModal())
    // this.closeModal();
  }

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
