import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

export interface VentasPorCategoria {
  categoria: string;
  cantidad: number;
  valor: number;
}

export interface ServiciosPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface ServiciosPorTipo {
  tipo: string;
  cantidad: number;
}

export interface ClientePorMes {
  mes: string;
  cantidad: number;
}

export interface TopCliente {
  nombre: string;
  compras: number;
  monto: number;
}

export interface TopClienteServicios {
  nombre: string;
  servicios: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // ========== TAB 1: VENTAS ==========
  
  /**
   * Obtener productos vendidos por categoría en el período
   */
  async getVentasPorCategoria(fechaDesde: string, fechaHasta: string): Promise<VentasPorCategoria[]> {
    try {
    // Obtener order_items del período con product_id
    const { data: orderItems, error: itemsError } = await this.supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner (
          created_at,
          payment_status
        )
      `)
      .gte('orders.created_at', fechaDesde)
      .lte('orders.created_at', fechaHasta)
      .eq('orders.payment_status', 'PAGADO');

    if (itemsError) throw itemsError;

    // Obtener productos con sus categorías
    const { data: products, error: productsError } = await this.supabase
      .from('products')
      .select(`
        id,
        categories (
          name
        )
      `);

    if (productsError) throw productsError;

    // Crear mapa de product_id -> categoría
    const productCategoryMap = new Map<number, string>();
    products?.forEach((product: any) => {
      productCategoryMap.set(
        product.id,
        product.categories?.name || 'Sin categoría'
      );
    });

    // Agrupar por categoría
    const grouped = (orderItems || []).reduce((acc: any, item: any) => {
      const categoria = productCategoryMap.get(item.product_id) || 'Sin categoría';
      
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          cantidad: 0,
          valor: 0
        };
      }

      acc[categoria].cantidad += item.quantity || 0;
      acc[categoria].valor += (item.quantity || 0) * (item.price || 0);

      return acc;
    }, {});

    const result: VentasPorCategoria[] = Object.values(grouped) as VentasPorCategoria[];
    console.log('📊 Ventas por categoría:', result);
    return result;
  } catch (error) {
    console.error('❌ Error al obtener ventas por categoría:', error);
    return [];
  }
  }

  // ========== TAB 2: SERVICIOS ==========
  
  /**
   * Obtener servicios agrupados por estado
   */
  async getServiciosPorEstado(fechaDesde: string, fechaHasta: string): Promise<ServiciosPorEstado[]> {
    try {
      const fechaDesdeConHora = `${fechaDesde}T00:00:00`;
      const fechaHastaConHora = `${fechaHasta}T23:59:59`;

      const { data, error } = await this.supabase
        .from('service_requests')
        .select('status')
        .gte('date_requested', fechaDesdeConHora)
        .lte('date_requested', fechaHastaConHora);

      if (error) throw error;

      // Contar por estado
      const counts: { [key: string]: number } = {};
      let total = 0;

      (data || []).forEach((request: any) => {
        const status = request.status || 'PENDIENTE';
        counts[status] = (counts[status] || 0) + 1;
        total++;
      });

      // Convertir a array con porcentajes
      const result = Object.entries(counts).map(([estado, cantidad]) => ({
        estado: this.translateServiceStatus(estado),
        cantidad,
        porcentaje: total > 0 ? (cantidad / total) * 100 : 0
      }));

      console.log('📊 Servicios por estado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener servicios por estado:', error);
      return [];
    }
  }

  /**
   * Obtener servicios agrupados por tipo
   */
  async getServiciosPorTipo(fechaDesde: string, fechaHasta: string): Promise<ServiciosPorTipo[]> {
    try {
      const fechaDesdeConHora = `${fechaDesde}T00:00:00`;
    const fechaHastaConHora = `${fechaHasta}T23:59:59`;
      const { data, error } = await this.supabase
        .from('service_requests')
        .select(`
          services (
            name
          )
        `)
        .gte('date_requested', fechaDesdeConHora)
        .lte('date_requested', fechaHastaConHora);

      if (error) throw error;

      // Contar por tipo
      const counts: { [key: string]: number } = {};

      (data || []).forEach((request: any) => {
        const tipo = request.services?.name || 'Sin tipo';
        counts[tipo] = (counts[tipo] || 0) + 1;
      });

      const result = Object.entries(counts).map(([tipo, cantidad]) => ({
        tipo,
        cantidad
      }));

      console.log('📊 Servicios por tipo:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener servicios por tipo:', error);
      return [];
    }
  }

  /**
   * Obtener tasas de aceptación y rechazo de servicios
   */
  async getTasasServicios(fechaDesde: string, fechaHasta: string): Promise<{
    total: number;
    tasaAceptacion: number;
    tasaRechazo: number;
  }> {
    try {
       const fechaDesdeConHora = `${fechaDesde}T00:00:00`;
    const fechaHastaConHora = `${fechaHasta}T23:59:59`;
    console.log('🔍 Buscando servicios desde:', fechaDesdeConHora, 'hasta:', fechaHastaConHora);
      const { data, error } = await this.supabase
        .from('service_requests')
        .select('status')
        .gte('date_requested', fechaDesdeConHora)
        .lte('date_requested', fechaHastaConHora);

      if (error) throw error;

      const total = (data || []).length;
      const aceptados = (data || []).filter((r: any) => 
        r.status === 'ACEPTADO' || r.status === 'COMPLETADO'
      ).length;
      const rechazados = (data || []).filter((r: any) => 
        r.status === 'RECHAZADO'
      ).length;

      const result = {
        total,
        tasaAceptacion: total > 0 ? (aceptados / total) * 100 : 0,
        tasaRechazo: total > 0 ? (rechazados / total) * 100 : 0
      };

      console.log('📊 Tasas de servicios:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener tasas de servicios:', error);
      return { total: 0, tasaAceptacion: 0, tasaRechazo: 0 };
    }
  }

  // ========== TAB 3: CLIENTES ==========
  
  /**
   * Obtener clientes registrados agrupados por mes
   */
  async getClientesPorMes(fechaDesde: string, fechaHasta: string): Promise<ClientePorMes[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('created_at')
        .eq('role_id', 2) // Solo clientes
        .gte('created_at', fechaDesde)
        .lte('created_at', fechaHasta)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por mes
      const mesesAbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const counts: { [key: string]: number } = {};

      (data || []).forEach((user: any) => {
        const fecha = new Date(user.created_at);
        const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`;
        const mesLabel = mesesAbrev[fecha.getMonth()];
        counts[mesKey] = (counts[mesKey] || 0) + 1;
      });

      // Convertir a array con labels de mes
      const result: ClientePorMes[] = [];
      const startDate = new Date(fechaDesde);
      const endDate = new Date(fechaHasta);

      for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        const mesKey = `${d.getFullYear()}-${d.getMonth()}`;
        const mesLabel = mesesAbrev[d.getMonth()];
        result.push({
          mes: mesLabel,
          cantidad: counts[mesKey] || 0
        });
      }

      console.log('📊 Clientes por mes:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener clientes por mes:', error);
      return [];
    }
  }

  /**
   * Obtener total de clientes únicos atendidos (con servicios)
   */
  async getTotalClientesAtendidos(fechaDesde: string, fechaHasta: string): Promise<number> {
    try {
    // ⭐ Agregar hora a las fechas
    const fechaDesdeConHora = `${fechaDesde}T00:00:00`;
    const fechaHastaConHora = `${fechaHasta}T23:59:59`;
    
    console.log('🔍 Buscando desde:', fechaDesdeConHora, 'hasta:', fechaHastaConHora);
    
    const { data, error } = await this.supabase
      .from('service_requests')
      .select('user_id, customer_email, customer_name, date_requested')
      .gte('date_requested', fechaDesdeConHora)
      .lte('date_requested', fechaHastaConHora);

    console.log('📦 Datos recibidos:', data);
    console.log('📊 Total registros encontrados:', data?.length || 0);

    if (error) throw error;

    const uniqueClients = new Set<string>();

    (data || []).forEach((request: any) => {
      if (request.user_id) {
        uniqueClients.add(`user_${request.user_id}`);
      } else if (request.customer_email && request.customer_email.trim() !== '') {
        uniqueClients.add(`email_${request.customer_email.toLowerCase()}`);
      }
    });

    const total = uniqueClients.size;
    console.log('📊 Total clientes únicos:', total);
    return total;
  } catch (error) {
    console.error('❌ Error:', error);
    return 0;
  }
  }

  /**
   * Obtener top clientes por monto de compras
   */
  async getTopClientesPorCompras(fechaDesde: string, fechaHasta: string, limit: number = 10): Promise<TopCliente[]> {
    try {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        user_id,
        total,
        users (
          full_name
        )
      `)
      .gte('created_at', fechaDesde)
      .lte('created_at', fechaHasta)
      .eq('payment_status', 'PAGADO');

    if (error) throw error;

    // Agrupar por usuario
    const grouped = (data || []).reduce((acc: any, order: any) => {
      const userId = order.user_id;
      const nombre = order.users?.full_name || 'Cliente sin nombre';
      
      if (!acc[userId]) {
        acc[userId] = {
          nombre,
          compras: 0,
          monto: 0
        };
      }

      acc[userId].compras++;
      acc[userId].monto += parseFloat(order.total) || 0;

      return acc;
    }, {});

    const result: TopCliente[] = Object.values(grouped)
      .sort((a: any, b: any) => b.monto - a.monto)
      .slice(0, limit) as TopCliente[];

    console.log('🏆 Top clientes por compras:', result);
    return result;
  } catch (error) {
    console.error('❌ Error al obtener top clientes por compras:', error);
    return [];
  }
  }

  /**
   * Obtener top clientes por cantidad de servicios solicitados
   */
  async getTopClientesPorServicios(fechaDesde: string, fechaHasta: string, limit: number = 10): Promise<TopClienteServicios[]> {
    try {
      const { data, error } = await this.supabase
        .from('service_requests')
        .select(`
          user_id,
          users (
            full_name
          )
        `)
        .gte('date_requested', fechaDesde)
        .lte('date_requested', fechaHasta);

      if (error) throw error;

      // Agrupar por usuario
      const counts: { [key: string]: { nombre: string; servicios: number } } = {};

      (data || []).forEach((request: any) => {
        const userId = request.user_id;
        const nombre = request.users?.full_name || 'Cliente sin nombre';
        
        if (!counts[userId]) {
          counts[userId] = { nombre, servicios: 0 };
        }
        counts[userId].servicios++;
      });

      const result = Object.values(counts)
        .sort((a, b) => b.servicios - a.servicios)
        .slice(0, limit);

      console.log('🏆 Top clientes por servicios:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener top clientes por servicios:', error);
      return [];
    }
  }

  // ========== UTILIDADES ==========
  
  /**
   * Traducir estados de servicios al español
   */
  private translateServiceStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'ACEPTADO': 'Aceptado',
      'RECHAZADO': 'Rechazado',
      'COMPLETADO': 'Completado',
      'CANCELADO': 'Cancelado'
    };
    return translations[status] || status;
  }
}
