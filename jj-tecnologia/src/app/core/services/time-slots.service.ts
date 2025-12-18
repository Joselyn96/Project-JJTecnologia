import { Injectable } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TimeSlot, AvailableTimeOption } from '../../shared/models/time-slot.model';

@Injectable({
  providedIn: 'root'
})
export class TimeSlotsService {

  private supabase;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.client;
  }

  /**
   * Obtener horarios disponibles para un día específico
   * @param date Fecha seleccionada por el usuario
   * @param serviceId ID del servicio (para validar disponibilidad)
   */
  async getAvailableTimesForDate(date: string, serviceId: number): Promise<AvailableTimeOption[]> {
    try {
      // 1. Calcular día de la semana (0=Domingo, 1=Lunes, ...)
      const selectedDate = new Date(date + 'T00:00:00');
      const dayOfWeek = selectedDate.getDay();

      // 2. Obtener horarios configurados para ese día
      const { data: slots, error: slotsError } = await this.supabase
        .from('available_time_slots')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;
      if (!slots || slots.length === 0) return [];

      // 3. Obtener solicitudes ya reservadas para esa fecha
      const { data: requests, error: requestsError } = await this.supabase
        .from('service_requests')
        .select('scheduled_date')
        .gte('scheduled_date', `${date}T00:00:00`)
        .lte('scheduled_date', `${date}T23:59:59`)
        .in('status', ['PENDIENTE', 'ACEPTADO']);

      if (requestsError) throw requestsError;

      // 4. Crear set de horarios ocupados
      const occupiedTimes = new Set(
        requests?.map(req => {
          const time = new Date(req.scheduled_date);
          return time.toTimeString().slice(0, 5); // "09:00"
        }) || []
      );

      // 5. Mapear horarios con disponibilidad
      return slots.map((slot: TimeSlot) => ({
        value: slot.start_time.slice(0, 5), // "09:00:00" → "09:00"
        label: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`,
        isAvailable: !occupiedTimes.has(slot.start_time.slice(0, 5))
      }));

    } catch (error) {
      console.error('Error al obtener horarios:', error);
      return [];
    }
  }

  /**
   * Obtener todos los horarios configurados (para admin)
   */
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    try {
      const { data, error } = await this.supabase
        .from('available_time_slots')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener todos los horarios:', error);
      return [];
    }
  }
}
