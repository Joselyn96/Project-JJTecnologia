import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceRequestsService } from '../../core/services/service-requests.service';
import { ServicesDataService } from '../../core/services/services-data.service';
import { ServiceRequest } from '../../shared/models/service-request.model';
import { FormsModule } from '@angular/forms';

interface ServiceRequestWithDetails extends ServiceRequest {
  service_name?: string;
  service_description?: string;
}

@Component({
  selector: 'app-admin-solicitudes',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-solicitudes.component.html',
  styleUrl: './admin-solicitudes.component.css'
})
export class AdminSolicitudesComponent implements OnInit {
  requests = signal<ServiceRequestWithDetails[]>([]);
  filteredRequests = signal<ServiceRequestWithDetails[]>([]);
  isLoading = signal(true);

  // Filtros
  selectedStatus = signal<string>('TODAS');
  searchTerm = signal<string>('');

  // Modal
  showModal = signal(false);
  selectedRequest = signal<ServiceRequestWithDetails | null>(null);
  modalAction = signal<'accept' | 'reject' | 'complete' | null>(null);
  adminNote = signal<string>('');
  rejectionReason = signal<string>('');

  constructor(
    private serviceRequestsService: ServiceRequestsService,
    private servicesDataService: ServicesDataService
  ) { }

  async ngOnInit() {
    await this.loadAllRequests();
  }

  async loadAllRequests() {
    this.isLoading.set(true);

    const data = await this.serviceRequestsService.getAllRequests();

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
    this.applyFilters();
    this.isLoading.set(false);

    console.log('🛠️ Solicitudes cargadas (ADMIN):', requestsWithDetails);
  }

  applyFilters() {
    let filtered = this.requests();

    // Filtrar por estado
    if (this.selectedStatus() !== 'TODAS') {
      filtered = filtered.filter(r => r.status === this.selectedStatus());
    }

    // Filtrar por búsqueda (nombre cliente, servicio, etc)
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(r =>
        r.customer_name.toLowerCase().includes(search) ||
        r.service_name?.toLowerCase().includes(search) ||
        r.customer_email.toLowerCase().includes(search) ||
        r.customer_phone.includes(search)
      );
    }

    this.filteredRequests.set(filtered);
  }

  onStatusFilterChange(status: string) {
    this.selectedStatus.set(status);
    this.applyFilters();
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  // Modal actions
  openModal(request: ServiceRequestWithDetails, action: 'accept' | 'reject' | 'complete') {
    this.selectedRequest.set(request);
    this.modalAction.set(action);
    // Mensajes predefinidos según la acción
    if (action === 'accept') {
      this.adminNote.set(
        `Hola ${request.customer_name}, hemos aceptado tu solicitud de ${request.service_name}. ` +
        `Nos pondremos en contacto con usted para confirmar los detalles del servicio agendado para el ${this.formatDateTime(request.scheduled_date)}. ` +
        `Gracias por confiar en nosotros.`
      );
    } else if (action === 'complete') {
      this.adminNote.set(
        `Servicio de ${request.service_name} completado exitosamente para ${request.customer_name}. ` +
        `Agradecemos su preferencia.`
      );
    } else {
      this.rejectionReason.set('');
    }

    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedRequest.set(null);
    this.modalAction.set(null);
    this.adminNote.set('');
    this.rejectionReason.set('');
  }

  async confirmAction() {
    const request = this.selectedRequest();
    const action = this.modalAction();

    if (!request || !action) return;

    let newStatus: 'ACEPTADO' | 'RECHAZADO' | 'COMPLETADO' | 'CANCELADO' = 'ACEPTADO';
    let rejectionReason: string | undefined;
    let adminNote: string | undefined;

    if (action === 'accept') {
      newStatus = 'ACEPTADO';
      adminNote = this.adminNote() || undefined;
    } else if (action === 'reject') {
      newStatus = 'RECHAZADO';
      rejectionReason = this.rejectionReason();
      if (!rejectionReason.trim()) {
        alert('Debes ingresar un motivo de rechazo');
        return;
      }
    } else if (action === 'complete') {
      newStatus = 'COMPLETADO';
      adminNote = this.adminNote() || undefined;
    }

    const result = await this.serviceRequestsService.updateRequestStatus(
      request.id!,
      newStatus,
      rejectionReason,
      adminNote
    );

    if (result.success) {
      await this.loadAllRequests();
      this.closeModal();
      // alert('Solicitud actualizada correctamente');
    } else {
      alert('❌ Error al actualizar: ' + result.error);
    }
  }

  // Utilidades
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

  // Estadísticas rápidas
  getTotalRequests(): number {
    return this.requests().length;
  }

  getPendingCount(): number {
    return this.requests().filter(r => r.status === 'PENDIENTE').length;
  }

  getAcceptedCount(): number {
    return this.requests().filter(r => r.status === 'ACEPTADO').length;
  }

  getCompletedCount(): number {
    return this.requests().filter(r => r.status === 'COMPLETADO').length;
  }
}
