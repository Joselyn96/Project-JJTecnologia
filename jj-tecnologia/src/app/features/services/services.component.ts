import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ServicesDataService } from '../../core/services/services-data.service';
import { TimeSlotsService } from '../../core/services/time-slots.service';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { Service } from '../../shared/models/service.model';
import { AvailableTimeOption } from '../../shared/models/time-slot.model';
import { EmailService } from '../../core/services/email.service';

type IconKey = 'wifi' | 'wrench' | 'shield' | 'code' | 'clock' | 'users';


interface ServiceItem extends Service {
  icon: IconKey;
  features: string[];
  duration: string;
  price: string;
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
export class ServicesComponent implements OnInit {
  // ====== DATA ======
  services = signal<ServiceItem[]>([]);
  whyItems = signal<WhyItem[]>([
    { icon: 'users', title: 'Equipo Profesional', description: 'Técnicos certificados con años de experiencia.' },
    { icon: 'clock', title: 'Respuesta Rápida', description: 'Atendemos en 24 horas o menos.' },
    { icon: 'shield', title: 'Garantía Completa', description: 'Todos nuestros servicios incluyen garantía.' },
  ]);

  // ====== MODAL STATE ======
  isModalOpen = signal(false);
  modalStep = signal<1 | 2>(1);
  selectedService = signal<ServiceItem | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // ====== FORM FIELDS ======
  date = signal<string>('');
  time = signal<string>('');
  name = signal<string>('');
  email = signal<string>('');
  phone = signal<string>('');
  address = signal<string>('');
  notes = signal<string>('');
  isSubmitted = signal(false);

  // ====== HORARIOS DISPONIBLES ======
  availableHours = signal<AvailableTimeOption[]>([]);
  isLoadingHours = signal(false);

  constructor(
    private servicesDataService: ServicesDataService,
    private timeSlotsService: TimeSlotsService,
    private serviceRequestsService: ServiceRequestsService,
    private emailService: EmailService
  ) { }

  async ngOnInit() {
    await this.loadServices();
  }

  /**
   * Cargar servicios desde Supabase
   */
  async loadServices() {
    this.isLoading.set(true);
    try {
      const dbServices = await this.servicesDataService.getActiveServices();

      // Mapear servicios de BD a ServiceItem con datos adicionales
      const mappedServices: ServiceItem[] = dbServices.map(service => ({
        ...service,
        icon: this.getIconForService(service.name),
        features: this.getFeaturesForService(service.name),
        duration: this.getDurationForService(service.name),
        price: `Desde S/ ${service.base_price}`
      }));

      this.services.set(mappedServices);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      this.errorMessage.set('Error al cargar servicios');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Cargar horarios disponibles cuando el usuario selecciona una fecha
   */
  async loadAvailableHours() {
    if (!this.date() || !this.selectedService()) return;

    this.isLoadingHours.set(true);
    try {
      const hours = await this.timeSlotsService.getAvailableTimesForDate(
        this.date(),
        this.selectedService()!.id
      );
      this.availableHours.set(hours.filter(h => h.isAvailable));
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      this.availableHours.set([]);
    } finally {
      this.isLoadingHours.set(false);
    }
  }

  /**
   * Mapear nombre de servicio a icono
   */
  private getIconForService(name: string): IconKey {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cctv') || lowerName.includes('cámara')) return 'wifi';
    if (lowerName.includes('mantenimiento') || lowerName.includes('pc')) return 'wrench';
    if (lowerName.includes('red') || lowerName.includes('cableado')) return 'shield';
    if (lowerName.includes('web') || lowerName.includes('desarrollo')) return 'code';
    return 'wrench';
  }

  /**
   * Obtener características por servicio (hardcoded por ahora)
   */
  private getFeaturesForService(name: string): string[] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cctv')) {
      return ['Instalación profesional', 'Monitoreo 24/7', 'Soporte técnico', 'Garantía 2 años'];
    }
    if (lowerName.includes('mantenimiento')) {
      return ['Diagnóstico gratis', 'Limpieza profunda', 'Optimización', 'Reemplazo de partes'];
    }
    if (lowerName.includes('red')) {
      return ['Diseño de red', 'Instalación', 'Configuración', 'Capacitación'];
    }
    if (lowerName.includes('web')) {
      return ['Diseño responsivo', 'SEO optimizado', 'Mantenimiento', 'Soporte'];
    }
    return ['Servicio profesional', 'Garantía incluida', 'Soporte técnico'];
  }

  /**
   * Obtener duración por servicio
   */
  private getDurationForService(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cctv')) return '2-4 horas';
    if (lowerName.includes('mantenimiento')) return '1-2 horas';
    return 'Según proyecto';
  }

  // ====== MÉTODOS PARA MANEJAR CAMBIOS ======
  async onDateChange(event: Event): Promise<void> {
    const value = (event.target as HTMLInputElement).value;
    this.date.set(value);
    this.time.set(''); // Reset hora cuando cambia la fecha
    await this.loadAvailableHours();
  }

  onTimeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.time.set(value);
  }

  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.name.set(value);
  }

  onEmailChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
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
    this.email.set('');
    this.phone.set('');
    this.address.set('');
    this.notes.set('');
    this.isSubmitted.set(false);
    this.availableHours.set([]);
    this.errorMessage.set(null);
  }

  nextStep() {
    if (!this.date() || !this.time()) return;
    this.modalStep.set(2);
  }

  prevStep() {
    this.modalStep.set(1);
  }

  /**
   * Enviar solicitud a Supabase
   */
  async submitRequest() {
    if (!this.selectedService() || !this.name() || !this.email() || !this.phone() || !this.address()) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // Combinar fecha y hora en formato ISO
      const scheduledDate = `${this.date()}T${this.time()}:00`;

      const result = await this.serviceRequestsService.createRequest({
        service_id: this.selectedService()!.id,
        scheduled_date: scheduledDate,
        customer_name: this.name(),
        customer_email: this.email(),
        customer_phone: this.phone(),
        customer_address: this.address(),
        customer_notes: this.notes() || undefined,
        status: 'PENDIENTE'
      });

      if (result.success) {
        this.isSubmitted.set(true);
        // Aquí puedes agregar lógica para enviar email
        // 📧 Enviar email de confirmación
        await this.emailService.sendServiceRequestEmail({
          customerEmail: this.email(),
          customerName: this.name(),
          serviceName: this.selectedService()!.name,
          scheduledDate: scheduledDate,
          phone: this.phone(),
          address: this.address()
        });
        console.log('Solicitud creada exitosamente:', result.data);
      } else {
        this.errorMessage.set(result.error || 'Error al crear la solicitud');
      }
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      this.errorMessage.set('Error al enviar la solicitud. Intenta nuevamente.');
    } finally {
      this.isLoading.set(false);
    }
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
