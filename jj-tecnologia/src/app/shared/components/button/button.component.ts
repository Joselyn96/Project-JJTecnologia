import { Component, input, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  // Input signals
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  isLoading = input<boolean>(false);
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  className = input<string>('');

  // Output para eventos
  clicked = output<MouseEvent>();

  // Computed signal para clases
  buttonClasses = computed(() => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
      secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return `${baseStyles} ${variants[this.variant()]} ${sizes[this.size()]} ${this.className()}`.trim();
  });

  // Método para manejar el click
  handleClick(event: MouseEvent) {
    if (!this.disabled() && !this.isLoading()) {
      this.clicked.emit(event);
    }
  }
}
