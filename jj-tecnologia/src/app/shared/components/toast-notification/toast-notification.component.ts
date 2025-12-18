import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-toast-notification',
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.css'
})
export class ToastNotificationComponent {
  notificationService = inject(NotificationService);

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  return icons[type] ?? 'info'; 
  }

  getColorClasses(type: string): string {
    const classes: { [key: string]: string } = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };
  return classes[type] ?? classes['info'];
  }

  close(id: number) {
    this.notificationService.remove(id);
  }
}
