import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderWithItems, Order } from '../../services/order.service';
import { ReceiptService } from '../../services/receipt.service';

interface OrderEdit {
  id: number;
  order_number: string;
  status: string;
  shipping_status: string;
  tracking_number: string;
  shipping_provider: string;
  customer_name: string;
  customer_email: string;
  total: number;
}

@Component({
  selector: 'app-admin-order',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-order.component.html',
  styleUrl: './admin-order.component.css'
})
export class AdminOrderComponent implements OnInit{
  // Signals para manejo de estado
  orders = signal<OrderWithItems[]>([]);
  isLoading = signal(true);
  showEditModal = signal(false);
  searchTerm = signal('');
  filterStatus = signal<string>('TODOS');
  
  // Orden actual en edición
  currentOrder = signal<OrderEdit>({
    id: 0,
    order_number: '',
    status: 'PENDIENTE',
    shipping_status: 'PENDIENTE',
    tracking_number: '',
    shipping_provider: '',
    customer_name: '',
    customer_email: '',
    total: 0
  });

  // Opciones de estados
  readonly statusOptions = [
    { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow' },
    { value: 'PROCESANDO', label: 'Procesando', color: 'blue' },
    { value: 'COMPLETADO', label: 'Completado', color: 'green' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'red' }
  ];

  readonly shippingStatusOptions = [
    { value: 'PENDIENTE', label: 'Pendiente', color: 'yellow' },
    { value: 'EN_CAMINO', label: 'En Camino', color: 'blue' },
    { value: 'ENTREGADO', label: 'Entregado', color: 'green' },
    { value: 'DEVUELTO', label: 'Devuelto', color: 'red' }
  ];

  readonly shippingProviders = [
    'Olva Courier',
    'Shalom',
    'Cruz del Sur',
    'Niuva',
    'Otro'
  ];

  constructor(
    private orderService: OrderService,
    private receiptService: ReceiptService
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    try {
      this.isLoading.set(true);
      const data = await this.orderService.getAllOrders();
      this.orders.set(data);
      console.log('📦 Órdenes cargadas:', data.length);
    } catch (error) {
      console.error('❌ Error cargando órdenes:', error);
      alert('Error al cargar las órdenes');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed: órdenes filtradas
  filteredOrders = computed(() => {
    let filtered = this.orders();
    
    // Filtro por estado
    const statusFilter = this.filterStatus();
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    // Filtro por búsqueda
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(term) ||
        o.users?.full_name?.toLowerCase().includes(term) ||
        o.shipping_address?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  });

  // Estadísticas rápidas
  stats = computed(() => {
    const all = this.orders();
    return {
      total: all.length,
      pendientes: all.filter(o => o.status === 'PENDIENTE').length,
      procesando: all.filter(o => o.status === 'PROCESANDO').length,
      completadas: all.filter(o => o.status === 'COMPLETADO').length
    };
  });

  openEditModal(order: OrderWithItems) {
    this.currentOrder.set({
      id: order.id!,
      order_number: order.order_number,
      status: order.status,
      shipping_status: order.shipping_status,
      tracking_number: order.tracking_number || '',
      shipping_provider: order.shipping_provider || '',
      customer_name: order.users?.full_name || 'N/A',
      customer_email: order.user_id || '',
      total: order.total
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  async handleSaveOrder() {
    try {
      const order = this.currentOrder();
      
      // Actualizar la orden completa
      await this.orderService.updateOrder(order.id, {
        status: order.status,
        shipping_status: order.shipping_status,
        tracking_number: order.tracking_number,
        shipping_provider: order.shipping_provider
      });

      // Actualizar la lista local
      this.orders.update(orders => 
        orders.map(o => 
          o.id === order.id 
            ? { 
                ...o, 
                status: order.status,
                shipping_status: order.shipping_status,
                tracking_number: order.tracking_number,
                shipping_provider: order.shipping_provider
              }
            : o
        )
      );

      this.closeEditModal();
      alert('Orden actualizada correctamente');
    } catch (error) {
      console.error('Error actualizando orden:', error);
      alert('Error al actualizar la orden');
    }
  }

  async downloadReceipt(order: OrderWithItems) {
    try {
      if (order.receipt_url) {
        // Si ya tiene URL, descargar directamente
        await this.receiptService.downloadPDF(order.receipt_url, order.order_number);
      } else {
        // Si no tiene, generar y descargar
        alert('Esta orden no tiene boleta generada');
      }
    } catch (error) {
      console.error('Error descargando boleta:', error);
      alert('Error al descargar la boleta');
    }
  }

  getStatusBadgeClass(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-700',
      'PROCESANDO': 'bg-blue-100 text-blue-700',
      'COMPLETADO': 'bg-green-100 text-green-700',
      'CANCELADO': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  getShippingBadgeClass(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-700',
      'EN_CAMINO': 'bg-blue-100 text-blue-700',
      'ENTREGADO': 'bg-green-100 text-green-700',
      'DEVUELTO': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setFilter(status: string) {
    this.filterStatus.set(status);
  }
}
