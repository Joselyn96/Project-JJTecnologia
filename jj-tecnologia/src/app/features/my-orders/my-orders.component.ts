import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrderService, OrderWithItems } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
@Component({
  selector: 'app-my-orders',
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css'
})
export class MyOrdersComponent implements OnInit{
  orders = signal<OrderWithItems[]>([]);
  isLoading = signal(true);

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.isLoading.set(true);
    
    const userId = this.authService.currentUser()?.id;
    
    if (!userId) {
      console.error('❌ No hay usuario logueado');
      this.router.navigate(['/']);
      return;
    }

    const data = await this.orderService.getOrdersByUserId(userId);
    this.orders.set(data);
    this.isLoading.set(false);
    
    console.log('📦 Pedidos cargados:', data);
  }

  downloadReceipt(receiptUrl: string, orderNumber: string) {
    if (!receiptUrl) {
      alert('No hay boleta disponible para este pedido');
      return;
    }

    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = `${orderNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'PAGADO': 'bg-green-100 text-green-800',
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'CANCELADO': 'bg-red-100 text-red-800',
      'EN_CAMINO': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
  getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDIENTE': 'Pendiente',
    'PROCESANDO': 'Procesando',
    'COMPLETADO': 'Completado',
    'CANCELADO': 'Cancelado'
  };
  return statusMap[status] || status;
}

getOrderStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE': 'bg-yellow-100 text-yellow-800',
    'PROCESANDO': 'bg-blue-100 text-blue-800',
    'COMPLETADO': 'bg-green-100 text-green-800',
    'CANCELADO': 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

getShippingStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDIENTE': 'Pendiente',
    'EN_CAMINO': 'En Camino',
    'ENTREGADO': 'Entregado',
    'DEVUELTO': 'Devuelto'
  };
  return statusMap[status] || status;
}

getShippingStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE': 'bg-gray-100 text-gray-800',
    'EN_CAMINO': 'bg-blue-100 text-blue-800',
    'ENTREGADO': 'bg-green-100 text-green-800',
    'DEVUELTO': 'bg-orange-100 text-orange-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}
}
