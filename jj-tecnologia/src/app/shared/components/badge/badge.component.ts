import { Component, Input, computed, signal } from '@angular/core';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';
@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() className = '';

  private base = signal(
    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  );

  private variants: Record<BadgeVariant, string> = {
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    danger: 'bg-danger-light text-danger',
    info: 'bg-info-light text-info',
    default: 'bg-surface text-text-secondary',
  };

  classes = computed(() => [
    this.base(),
    this.variants[this.variant] ?? this.variants.default,
    this.className,
  ]);
}
