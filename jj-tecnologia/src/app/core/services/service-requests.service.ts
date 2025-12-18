import { Injectable } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ServiceRequest, CreateServiceRequestDTO } from '../../shared/models/service-request.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestsService {

  private supabase;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.client;
  }

  /**
   * Crear una nueva solicitud de servicio
   */
  async createRequest(request: CreateServiceRequestDTO): Promise<{ success: boolean; data?: ServiceRequest; error?: string }> {
    try {
    const { data: { user } } = await this.supabase.auth.getUser();

    const insertData = {
      user_id: user?.id || null,
      service_id: request.service_id,
      scheduled_date: request.scheduled_date,
      customer_name: request.customer_name,
      customer_email: request.customer_email,
      customer_phone: request.customer_phone,
      customer_address: request.customer_address,
      customer_notes: request.customer_notes || null,
      status: 'PENDIENTE',
      date_requested: new Date().toISOString()
    };

    // ← AGREGAR ESTE CONSOLE.LOG
    console.log('🔍 Datos que voy a insertar:', insertData);

    const { data, error } = await this.supabase
      .from('service_requests')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error al crear solicitud:', error);
    return { success: false, error: error.message };
  }
  }

  /**
   * Obtener todas las solicitudes (para admin)
   */
  async getAllRequests(): Promise<ServiceRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('service_requests')
        .select('*')
        .order('date_requested', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      return [];
    }
  }

  /**
   * Obtener solicitudes de un usuario específico
   */
  async getRequestsByUserId(userId: string): Promise<ServiceRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .order('date_requested', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener solicitudes del usuario:', error);
      return [];
    }
  }

  /**
   * Actualizar estado de una solicitud (para admin)
   */
  async updateRequestStatus(
    id: number,
    status: 'ACEPTADO' | 'RECHAZADO' | 'COMPLETADO' | 'CANCELADO',
    rejectionReason?: string,
    adminNote?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };

      if (rejectionReason) updateData.rejection_reason = rejectionReason;
      if (adminNote) updateData.admin_note = adminNote;

      const { error } = await this.supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error al actualizar solicitud:', error);
      return { success: false, error: error.message };
    }
  }
}
