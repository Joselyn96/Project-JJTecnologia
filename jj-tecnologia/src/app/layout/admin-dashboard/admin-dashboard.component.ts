import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { SalesLineChartComponent } from '../../shared/components/sales-line-chart/sales-line-chart.component';
import { TopProductsChartComponentComponent } from '../../shared/components/top-products-chart-component/top-products-chart-component.component';
//
import { ProductsService } from '../../services/products.service';
import { NotificationService } from '../../services/notification.service';
//
interface DashboardStats {
  salesMonth: number;
  ordersToday: number;
  pendingServices: number;
  lowStockProducts: number;
}

interface RecentOrder {
  orderNumber: string;
  customer: string;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
}


interface TopProduct {
  name: string;
  total: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [NgFor, DecimalPipe, NgClass, SalesLineChartComponent, TopProductsChartComponentComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit{
  stats: DashboardStats = {
    salesMonth: 0,
    ordersToday: 0,
    pendingServices: 0,
    lowStockProducts: 0
  };
  
  recentOrders: RecentOrder[] = [];
  isLoading = true;

  constructor(private dashboardService: DashboardService,
              private productsService: ProductsService,
              private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
    await this.checkLowStockProducts();
  }

  /**
   * Cargar todos los datos del dashboard
   */
  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;

      // Cargar estadísticas y órdenes recientes en paralelo
      const [stats, orders] = await Promise.all([
        this.dashboardService.getStats(),
        this.dashboardService.getRecentOrders()
      ]);

      this.stats = stats;
      this.recentOrders = orders;

      console.log('✅ Dashboard cargado:', { stats, orders: orders.length });
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async checkLowStockProducts(): Promise<void> {
    console.log('INICIANDO checkLowStockProducts'); // ✅ AGREGAR ESTA LÍNEA
    try {
      const STOCK_MINIMO = 5; // ← Umbral hardcodeado (puedes cambiar este valor)
      console.log('STOCK_MINIMO:', STOCK_MINIMO); // ✅ AGREGAR ESTA LÍNEA
      const { count, products } = await this.productsService.getLowStockProducts(STOCK_MINIMO);
console.log('Productos encontrados:', { count, products });
      if (count > 0) {
        // Crear mensaje con nombres de productos (máximo 3)
        const productNames = products
          .slice(0, 3)
          .map(p => `${p.name} (${p.stock} ${p.stock === 1 ? 'unidad' : 'unidades'})`)
          .join(', ');

        const moreProducts = count > 3 ? ` y ${count - 3} más` : '';

        this.notificationService.warning(
          'Productos con bajo stock',
          `${count} producto${count > 1 ? 's' : ''} con menos de ${STOCK_MINIMO} unidades: ${productNames}${moreProducts}`,
          8000 // 8 segundos antes de auto-cerrar
        );

      } else {
        console.log('✅ Todos los productos tienen stock suficiente');
      }
    } catch (error) {
      console.error('❌ Error al verificar stock bajo:', error);
    }
  }

  /**
   * Refrescar datos del dashboard
   */
  async refresh(): Promise<void> {
    await this.loadDashboardData();
     await this.checkLowStockProducts();
  }
}
