import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

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

interface RevenueData {
  labels: string[];
  data: number[];
}

type Period = 'day' | 'week' | 'month';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  /**
   * Obtener estadísticas principales del dashboard
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const [salesMonth, ordersToday, pendingServices, lowStockProducts] = await Promise.all([
        this.getSalesMonth(),
        this.getOrdersToday(),
        this.getPendingServices(),
        this.getLowStockProducts()
      ]);

      return {
        salesMonth,
        ordersToday,
        pendingServices,
        lowStockProducts
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Ventas del mes actual
   */
  private async getSalesMonth(): Promise<number> {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayISO = firstDay.toISOString();

      const { data, error } = await this.supabase
        .from('orders')
        .select('total')
        .gte('created_at', firstDayISO)
        .eq('payment_status', 'PAGADO');

      if (error) throw error;

      const total = data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      console.log('📊 Ventas del mes:', total);
      return total;
    } catch (error) {
      console.error('❌ Error obteniendo ventas del mes:', error);
      return 0;
    }
  }

  /**
   * Órdenes de hoy
   */
  private async getOrdersToday(): Promise<number> {
    try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count, error } = await this.supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (error) throw error;

    console.log('📦 Órdenes de hoy:', count);
    return count || 0;
  } catch (error) {
    console.error('❌ Error obteniendo órdenes de hoy:', error);
    return 0;
  }
  }

  /**
   * Servicios pendientes
   * 🚧 IMPLEMENTACIÓN FUTURA - Por ahora retorna 0
   */
  private async getPendingServices(): Promise<number> {
    // TODO: Descomentar cuando service_requests tenga datos
   
    try {
      const { count, error } = await this.supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDIENTE');

      if (error) throw error;

      console.log('🔧 Servicios pendientes:', count);
      return count || 0;
    } catch (error) {
      console.error('❌ Error obteniendo servicios pendientes:', error);
      return 0;
    }
    

    // Retorno temporal mientras no haya datos
    return 0;
  }

  /**
   * Productos con stock bajo (menor a 10 unidades)
   */
  private async getLowStockProducts(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock', 10)
        .eq('active', true);

      if (error) throw error;

      console.log('⚠️ Productos con bajo stock:', count);
      return count || 0;
    } catch (error) {
      console.error('❌ Error obteniendo productos con bajo stock:', error);
      return 0;
    }
  }

  /**
   * Órdenes recientes (últimas 10)
   */
  async getRecentOrders(): Promise<RecentOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          order_number,
          total,
          status,
          payment_status,
          created_at,
          users (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const orders: RecentOrder[] = (data || []).map((order: any) => ({
        orderNumber: order.order_number,
        customer: order.users?.full_name || 'Sin nombre',
        date: new Date(order.created_at).toLocaleDateString('es-PE'),
        total: order.total,
        status: this.translateStatus(order.status),
        paymentStatus: this.translatePaymentStatus(order.payment_status) 
      }));

      console.log('📋 Órdenes recientes:', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ Error obteniendo órdenes recientes:', error);
      return [];
    }
  }

  /**
   * Top 5 productos más vendidos
   */
  async getTopProducts(): Promise<TopProduct[]> {
    try {
      const { data, error } = await this.supabase
        .from('order_items')
        .select('product_name, quantity');

      if (error) throw error;

      // Agrupar por producto y sumar cantidades
      const productMap = new Map<string, number>();
      
      data?.forEach(item => {
        const current = productMap.get(item.product_name) || 0;
        productMap.set(item.product_name, current + item.quantity);
      });

      // Convertir a array y ordenar
      const topProducts = Array.from(productMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      console.log('🏆 Top productos:', topProducts);
      return topProducts;
    } catch (error) {
      console.error('❌ Error obteniendo top productos:', error);
      return [];
    }
  }

  /**
   * Obtener datos de ventas por período para el gráfico
   */
  async getRevenueByPeriod(period: Period): Promise<RevenueData> {
    try {
      const now = new Date();
      let startDate: Date;
      let labels: string[] = [];
      let groupBy: 'day' | 'week' | 'month';

      switch (period) {
        case 'day':
          // Últimos 15 días
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 14);
          groupBy = 'day';
          
          for (let i = 14; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            labels.push(d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }));
          }
          break;

        case 'week':
          // Últimas 8 semanas
          startDate = new Date(now);
          startDate.setDate(now.getDate() - (7 * 8));
          groupBy = 'week';
          
          for (let i = 7; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - (i * 7));
            labels.push(`Sem ${this.getWeekNumber(d)}`);
          }
          break;

        case 'month':
          // Últimos 6 meses
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 5);
          groupBy = 'month';
          
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(now.getMonth() - i);
            labels.push(d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }));
          }
          break;
      }

      const { data, error } = await this.supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('payment_status', 'PAGADO')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar datos según el período
      const groupedData = this.groupDataByPeriod(data || [], groupBy, labels.length);

      console.log('📈 Datos de ventas:', { period, labels, data: groupedData });
      return { labels, data: groupedData };
    } catch (error) {
      console.error('❌ Error obteniendo datos de ventas:', error);
      return { labels: [], data: [] };
    }
  }

  /**
   * Agrupar datos de ventas por período
   */
  private groupDataByPeriod(orders: any[], groupBy: 'day' | 'week' | 'month', length: number): number[] {
    const result = new Array(length).fill(0);
    const now = new Date();

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      let index = -1;

      switch (groupBy) {
        case 'day':
          const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
          index = length - 1 - daysDiff;
          break;

        case 'week':
          const weeksDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          index = length - 1 - weeksDiff;
          break;

        case 'month':
          const monthsDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + 
                           (now.getMonth() - orderDate.getMonth());
          index = length - 1 - monthsDiff;
          break;
      }

      if (index >= 0 && index < length) {
        result[index] += order.total || 0;
      }
    });

    return result;
  }

  /**
   * Obtener número de semana del año
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Traducir estados de órdenes al español
   */
  private translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'PROCESANDO': 'En proceso',
      'COMPLETADO': 'Pagado',
      'CANCELADO': 'Cancelado'
    };
    return translations[status] || status;
  }
  private translatePaymentStatus(status: string): string {
  const translations: any = {
    'PAGADO': 'Pagado',
    'PENDIENTE': 'Pendiente',
    'FALLIDO': 'Fallido',
    'REEMBOLSADO': 'Reembolsado'
  };
  return translations[status] || status;
}
}
