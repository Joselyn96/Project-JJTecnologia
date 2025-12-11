import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, Service } from '../../services/services.service';

@Component({
  selector: 'app-admin-services',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-services.component.html',
  styleUrl: './admin-services.component.css'
})
export class AdminServicesComponent implements OnInit{
   showModal = signal(false);
  isEditing = signal(false);
  searchTerm = signal('');
  
  currentService = signal<Service>({
    name: '',
    description: '',
    base_price: 0,
    active: true
  });

  constructor(public servicesService: ServicesService) {}

  async ngOnInit() {
    await this.servicesService.loadServices();
  }

  get filteredServices() {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.servicesService.services();
    
    return this.servicesService.services().filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term)
    );
  }

  // ← AGREGA ESTE GETTER
  get activeServicesCount(): number {
    return this.servicesService.services().filter(s => s.active).length;
  }
  // ← AGREGA ESTOS MÉTODOS
  updateName(value: string) {
    this.currentService.update(s => ({ ...s, name: value }));
  }

  updateDescription(value: string) {
    this.currentService.update(s => ({ ...s, description: value }));
  }

  updateBasePrice(value: number) {
    this.currentService.update(s => ({ ...s, base_price: value }));
  }

  updateActive(value: boolean) {
    this.currentService.update(s => ({ ...s, active: value }));
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentService.set({
      name: '',
      description: '',
      base_price: 0,
      active: true
    });
    this.showModal.set(true);
  }

  openEditModal(service: Service) {
    this.isEditing.set(true);
    this.currentService.set({ ...service });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async handleSubmit() {
    try {
      const service = this.currentService();
      
      if (this.isEditing() && service.id) {
        await this.servicesService.updateService(service.id, service);
      } else {
        await this.servicesService.createService(service);
      }
      
      this.closeModal();
    } catch (error: any) {
      console.error('Error saving service:', error);
      alert(error.message || 'Error al guardar el servicio');
    }
  }

  async handleDelete(id: number) {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      try {
        await this.servicesService.deleteService(id);
      } catch (error: any) {
        console.error('Error deleting service:', error);
        alert(error.message || 'Error al eliminar el servicio');
      }
    }
  }

  async toggleStatus(service: Service) {
    try {
      await this.servicesService.toggleServiceStatus(service.id!, !service.active);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(error.message || 'Error al cambiar el estado');
    }
  }

  formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
  }
}
