export interface ServiceRequest {
  id?: number;
  user_id?: string;
  service_id: number;
  date_requested?: string;
  scheduled_date: string; // Fecha + hora combinadas
  status: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'COMPLETADO' | 'CANCELADO';
  rejection_reason?: string;
  admin_note?: string;
  internal_notes?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_notes?: string;
}

export interface CreateServiceRequestDTO {
  service_id: number;
  scheduled_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_notes?: string;
  status: 'PENDIENTE';
}