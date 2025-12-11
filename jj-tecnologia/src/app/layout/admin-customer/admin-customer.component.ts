import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderWithItems } from '../../services/order.service';

interface CustomerData {
  user_id: string;
  full_name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

@Component({
  selector: 'app-admin-customer',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-customer.component.html',
  styleUrl: './admin-customer.component.css'
})
export class AdminCustomerComponent implements OnInit {
  private orderService = inject(OrderService);

  customers = signal<CustomerData[]>([]);
  filteredCustomers = signal<CustomerData[]>([]);
  searchTerm = signal('');
  isLoading = signal(false);

  ngOnInit() {
    this.loadCustomers();
  }

  async loadCustomers() {
    this.isLoading.set(true);
    try {
      const orders = await this.orderService.getAllOrders();
      const customersMap = new Map<string, CustomerData>();

      orders.forEach(order => {
        const userId = order.user_id;
        const userName = order.users?.full_name || 'Sin nombre';

        if (!customersMap.has(userId)) {
          customersMap.set(userId, {
            user_id: userId,
            full_name: userName,
            email: '', // Puedes agregarlo después si lo necesitas
            total_orders: 0,
            total_spent: 0,
            last_order_date: order.created_at
          });
        }

        const customer = customersMap.get(userId)!;
        customer.total_orders++;
        customer.total_spent += Number(order.total);

        // Actualizar última fecha si es más reciente
        if (new Date(order.created_at) > new Date(customer.last_order_date)) {
          customer.last_order_date = order.created_at;
        }
      });

      const customersList = Array.from(customersMap.values())
        .sort((a, b) => b.total_spent - a.total_spent);

      this.customers.set(customersList);
      this.filteredCustomers.set(customersList);

      console.log('✅ Clientes cargados:', customersList.length);
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  filterCustomers() {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.filteredCustomers.set(this.customers());
      return;
    }

    const filtered = this.customers().filter(customer =>
      customer.full_name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );

    this.filteredCustomers.set(filtered);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

}
