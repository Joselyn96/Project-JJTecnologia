import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

export interface CreateOrderRequest {
  user_id: string;
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    product_name: string;    // ← NUEVO
    product_sku: string;      // ← NUEVO
  }>;
  shipping_address: string;
  district: string;
  province: string;
  department: string;
  reference?: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  payment_method: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  shipping_address: string;
  district: string;
  province: string;
  department: string;
  reference?: string;
  payment_method?: string;
  payment_status: string;
  status: string;
  shipping_status: string;
  tracking_number?: string;
  shipping_provider?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}
export interface OrderWithItems extends Order {
  order_items: Array<{
    id: number;
    quantity: number;
    price: number;
    subtotal: number;
    product_name: string;
    product_sku: string;
  }>;
  users?: {
    full_name: string;
  };
  order_number: string;
}


@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  /**
   * Simular procesamiento de pago con token de Culqi
   * En producción, esto se haría en el backend con Edge Functions
   */
  async processPayment(token: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Procesando pago...');
      console.log('Token:', token);
      console.log('Monto:', amount);

      // SIMULACIÓN: En producción, aquí llamarías a tu Edge Function
      // que procesaría el cargo con Culqi usando la Secret Key

      // Simular delay de procesamiento (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular pago exitoso (95% de éxito para testing)
      const success = Math.random() > 0.05;

      if (success) {
        console.log('✅ Pago exitoso (simulado)');
        return { success: true };
      } else {
        console.log('❌ Pago rechazado (simulado)');
        return { success: false, error: 'Pago rechazado por el banco' };
      }
    } catch (error: any) {
      console.error('❌ Error procesando pago:', error);
      return { success: false, error: error.message };
    }
  }

   /**
   * Método auxiliar para hacer rollback de una orden
   */
  private async rollbackOrder(orderId: number): Promise<void> {
    console.log(`🔄 Haciendo rollback de orden ${orderId}...`);
    
    try {
      // 1. Eliminar order_items
      const { error: itemsError } = await this.supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('❌ Error eliminando order_items en rollback:', itemsError);
      } else {
        console.log('✅ Order items eliminados en rollback');
      }

      // 2. Eliminar orden
      const { error: orderError } = await this.supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('❌ Error eliminando orden en rollback:', orderError);
      } else {
        console.log('✅ Orden eliminada en rollback');
      }

      console.log('✅ Rollback completado exitosamente');
    } catch (error) {
      console.error('❌ Error crítico durante rollback:', error);
    }
  }
  
  /**
   * Crear una orden completa (order + order_items)
   */
  async createOrder(orderData: CreateOrderRequest): Promise<{ success: boolean; order?: Order; error?: string }> {
    let createdOrderId: number | null = null;
  
  try {
    console.log('📝 Creando orden en Supabase...');

    // 1. Crear la orden principal
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        total: orderData.total_amount,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shipping_cost,
        shipping_address: orderData.shipping_address,
        district: orderData.district,
        province: orderData.province,
        department: orderData.department,
        reference: orderData.reference,
        payment_method: orderData.payment_method,
        payment_status: 'PAGADO',
        status: 'PENDIENTE',
        shipping_status: 'PENDIENTE',
        tracking_number: null,
        shipping_provider: null,
        receipt_url: null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creando orden:', orderError);
      return { success: false, error: orderError.message };
    }

    createdOrderId = order.id; // Guardar ID para posible rollback
    console.log('✅ Orden creada:', order.id);

    // 2. Crear los order_items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      product_name: item.product_name,
      product_sku: item.product_sku
    }));

    const { error: itemsError } = await this.supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Error creando order items:', itemsError);
      // ROLLBACK: Eliminar la orden creada
      if (createdOrderId) await this.rollbackOrder(createdOrderId);
      return { success: false, error: 'Error creando los items de la orden. Operación cancelada.' };
    }

    console.log('✅ Order items creados');

    // 3. Reducir el stock de los productos (operación crítica)
    for (const item of orderData.items) {
      const { error: stockError } = await this.supabase
        .rpc('reduce_product_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });

      if (stockError) {
        console.error(`❌ Error reduciendo stock para producto ${item.product_id}:`, stockError);
        
        // ROLLBACK: Eliminar orden y order_items
        if (createdOrderId) await this.rollbackOrder(createdOrderId);
        
        return { 
          success: false, 
          error: `Stock insuficiente para "${item.product_name}". Tu orden ha sido cancelada y no se realizó ningún cargo.` 
        };
      }

      console.log(`✅ Stock reducido para producto ${item.product_id}`);
    }

    console.log('✅ Stock actualizado correctamente');
    console.log('🎉 Orden completa creada exitosamente');

    return { success: true, order };
    
  } catch (error: any) {
    console.error('❌ Error inesperado creando orden:', error);
    
    // ROLLBACK: Si se creó alguna orden, eliminarla
    if (createdOrderId) {
      await this.rollbackOrder(createdOrderId);
    }
    
    return { 
      success: false, 
      error: 'Ocurrió un error inesperado. La operación ha sido cancelada.' 
    };
  }
  }

  /**
   * Actualizar el estado de pago de una orden
   */
  async updatePaymentStatus(orderId: number, status: 'pending' | 'paid' | 'failed'): Promise<boolean> {
    const { error } = await this.supabase
      .from('orders')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    return !error;
  }

  /**
   * Actualizar el estado de envío
   */
  async updateShippingStatus(
    orderId: number,
    status: 'pending' | 'in_transit' | 'delivered',
    trackingNumber?: string,
    shippingProvider?: string
  ): Promise<boolean> {
    const updateData: any = {
      shipping_status: status,
      updated_at: new Date().toISOString()
    };

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    if (shippingProvider) {
      updateData.shipping_provider = shippingProvider;
    }

    const { error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    return !error;
  }

  /**
   * Obtener órdenes del usuario
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo órdenes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtener una orden específica con sus items
   */
  async getOrderById(orderId: number) {
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error obteniendo orden:', orderError);
      return null;
    }

    return order;
  }


  async updateReceiptUrl(orderId: number, receiptUrl: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('orders')
        .update({
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error actualizando receipt_url:', error);
        return false;
      }

      console.log('✅ Receipt URL actualizado para orden:', orderId);
      return true;
    } catch (error) {
      console.error('❌ Error inesperado actualizando receipt_url:', error);
      return false;
    }
  }
  

/**
 * Obtener todos los pedidos de un usuario con sus items
 */
async getOrdersByUserId(userId: string): Promise<OrderWithItems[]> {
  try {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          subtotal,
          product_name,
          product_sku
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      return [];
    }

    console.log('✅ Pedidos obtenidos:', data);
    return data as OrderWithItems[] || [];
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return [];
  }
}

/**
 * Obtener un pedido específico por número de orden
 */
async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  try {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          subtotal,
          product_name,
          product_sku
        )
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      console.error('❌ Error obteniendo pedido:', error);
      return null;
    }

    return data as OrderWithItems;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return null;
  }
}
/**
   * Obtener TODAS las órdenes (solo admin)
   * @returns Array de órdenes con items incluidos
   */
  async getAllOrders(): Promise<OrderWithItems[]> {
   try {
    // 1. Obtener órdenes con items
    const { data: orders, error: ordersError } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price,
          subtotal,
          product_name,
          product_sku
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error obteniendo órdenes:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // 2. Extraer user_ids únicos
    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
    console.log('🔍 User IDs encontrados:', userIds);

    // 3. Obtener información de usuarios
    const { data: users, error: usersError } = await this.supabase
      .from('users')
      .select('id, full_name')
      .in('id', userIds);

    if (usersError) {
      console.error('⚠️ Error obteniendo usuarios:', usersError);
    }

    console.log('✅ Usuarios obtenidos:', users?.length || 0);
    console.log('🔍 Usuarios:', users);

    // 4. Crear mapa de usuarios por ID
    const usersMap = new Map(
      users?.map(u => [u.id, { full_name: u.full_name }]) || []
    );

    // 5. Combinar órdenes con usuarios
    const ordersWithUsers = orders.map(order => ({
      ...order,
      users: usersMap.get(order.user_id) || null
    }));

    console.log('✅ Órdenes con usuarios:', ordersWithUsers.length);
    console.log('🔍 Primera orden:', ordersWithUsers[0]);

    return ordersWithUsers as OrderWithItems[];
  } catch (error) {
    console.error('❌ Error inesperado en getAllOrders:', error);
    throw error;
  }
  }

  /**
   * Actualizar toda la información de la orden (método completo para admin)
   * @param orderId - ID de la orden
   * @param updates - Objeto con los campos a actualizar
   */
  async updateOrder(orderId: number, updates: Partial<Order>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error actualizando orden:', error);
        throw error;
      }

      console.log(`✅ Orden ${orderId} actualizada correctamente`);
      return true;
    } catch (error) {
      console.error('❌ Error inesperado en updateOrder:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de órdenes para el dashboard
   */
  async getOrderStats() {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('status, payment_status, shipping_status, total');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pendientes: data?.filter(o => o.status === 'PENDIENTE').length || 0,
        procesando: data?.filter(o => o.status === 'PROCESANDO').length || 0,
        completadas: data?.filter(o => o.status === 'COMPLETADO').length || 0,
        canceladas: data?.filter(o => o.status === 'CANCELADO').length || 0,
        totalVentas: data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
      };

      console.log('📊 Estadísticas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}
