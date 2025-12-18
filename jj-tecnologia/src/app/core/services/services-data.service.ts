import { Injectable } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Service } from '../../shared/models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServicesDataService {
  private supabase;

  constructor(private authService: AuthService) {
    this.supabase = this.authService.client;
  }

  /**
   * Obtener todos los servicios activos
   */
  async getActiveServices(): Promise<Service[]> {
    try {
      const { data, error } = await this.supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      return [];
    }
  }

  /**
   * Obtener un servicio por ID
   */
  async getServiceById(id: number): Promise<Service | null> {
    try {
      const { data, error } = await this.supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener servicio:', error);
      return null;
    }
  }
}
