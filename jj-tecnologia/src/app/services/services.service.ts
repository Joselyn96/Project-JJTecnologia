import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

export interface Service {
  id?: number;
  name: string;
  description: string;
  base_price: number;
  active: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private supabase: SupabaseClient;

  services = signal<Service[]>([]);
  isLoading = signal(false);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async loadServices() {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.services.set(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createService(service: Service) {
    const { data, error } = await this.supabase
      .from('services')
      .insert([service])
      .select()
      .single();

    if (error) throw error;
    await this.loadServices();
    return data;
  }

  async updateService(id: number, service: Partial<Service>) {
    const { data, error } = await this.supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await this.loadServices();
    return data;
  }

  async deleteService(id: number) {
    const { error } = await this.supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this.loadServices();
  }

  async toggleServiceStatus(id: number, active: boolean) {
    await this.updateService(id, { active });
  }
}
