import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
private supabaseUrl = environment.supabaseUrl;
  private supabaseKey = environment.supabaseKey;

  async sendServiceRequestEmail(data: {
    customerEmail: string;
    customerName: string;
    serviceName: string;
    scheduledDate: string;
    phone: string;
    address: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/send-service-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar email');
      }

      console.log('✅ Email enviado:', result);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error al enviar email:', error);
      return { success: false, error: error.message };
    }
  }
}
