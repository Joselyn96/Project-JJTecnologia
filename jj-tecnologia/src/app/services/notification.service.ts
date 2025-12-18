import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  constructor() { }

  /**
   * Mostrar notificación de éxito
   */
  success(title: string, message: string, duration: number = 3000) {
    this.show('success', title, message, duration);
  }

  /**
   * Mostrar notificación de error
   */
  error(title: string, message: string, duration: number = 5000) {
    this.show('error', title, message, duration);
  }

  /**
   * Mostrar notificación de advertencia
   */
  warning(title: string, message: string, duration: number = 4000) {
    this.show('warning', title, message, duration);
  }

  /**
   * Mostrar notificación de información
   */
  info(title: string, message: string, duration: number = 3000) {
    this.show('info', title, message, duration);
  }

  /**
   * Método genérico para mostrar notificación
   */
  private show(type: Toast['type'], title: string, message: string, duration: number) {
    const toast: Toast = {
      id: this.nextId++,
      type,
      title,
      message,
      duration
    };

    // Agregar el toast
    this.toasts.update(toasts => [...toasts, toast]);

    // Auto-remover después de la duración
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  /**
   * Remover una notificación específica
   */
  remove(id: number) {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Limpiar todas las notificaciones
   */
  clear() {
    this.toasts.set([]);
  }
}
