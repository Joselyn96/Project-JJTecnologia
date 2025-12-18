import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { ServicesDataService } from '../../core/services/services-data.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ServiceRequest } from '../../shared/models/service-request.model';

interface ServiceRequestWithDetails extends ServiceRequest {
  service_name?: string;
  service_description?: string;
}

@Component({
  selector: 'app-my-services',
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './my-services.component.html',
  styleUrl: './my-services.component.css'
})
export class MyServicesComponent implements OnInit {
  requests = signal<ServiceRequestWithDetails[]>([]);
  isLoading = signal(true);

  constructor(
    private serviceRequestsService: ServiceRequestsService,
    private servicesDataService: ServicesDataService,
    private authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadServiceRequests();
  }

  async loadServiceRequests() {
    this.isLoading.set(true);

    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      console.error('❌ No hay usuario logueado');
      this.router.navigate(['/']);
      return;
    }

    const data = await this.serviceRequestsService.getRequestsByUserId(userId);

    // Obtener nombres de servicios
    const requestsWithDetails = await Promise.all(
      data.map(async (request) => {
        const service = await this.servicesDataService.getServiceById(request.service_id);
        return {
          ...request,
          service_name: service?.name || 'Servicio no disponible',
          service_description: service?.description || ''
        };
      })
    );

    this.requests.set(requestsWithDetails);
    this.isLoading.set(false);

    console.log('🛠️ Solicitudes de servicio cargadas:', requestsWithDetails);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'ACEPTADO': 'Aceptado',
      'RECHAZADO': 'Rechazado',
      'COMPLETADO': 'Completado',
      'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'ACEPTADO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800',
      'COMPLETADO': 'bg-blue-100 text-blue-800',
      'CANCELADO': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'PENDIENTE': 'schedule',
      'ACEPTADO': 'check_circle',
      'RECHAZADO': 'cancel',
      'COMPLETADO': 'task_alt',
      'CANCELADO': 'block'
    };
    return icons[status] || 'help';
  }
}
