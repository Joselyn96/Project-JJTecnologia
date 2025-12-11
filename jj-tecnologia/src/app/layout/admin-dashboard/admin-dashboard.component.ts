import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { SalesLineChartComponent } from '../../shared/components/sales-line-chart/sales-line-chart.component';
import { TopProductsChartComponentComponent } from '../../shared/components/top-products-chart-component/top-products-chart-component.component';

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
  imports: [NgFor, NgIf, DecimalPipe, NgClass, SalesLineChartComponent, TopProductsChartComponentComponent],
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

  constructor(private dashboardService: DashboardService) {}

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
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

  /**
   * Refrescar datos del dashboard
   */
  async refresh(): Promise<void> {
    await this.loadDashboardData();
  }
}
