import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
 // Input signals (Angular 19)
  hover = input<boolean>(false);
  className = input<string>('');

  // Computed signal para clases dinámicas
  cardClasses = computed(() => {
    const base = 'bg-white rounded-2xl border border-gray-200 shadow-sm p-6';
    const hoverEffect = this.hover() 
      ? 'transition-all duration-300 ease-in-out hover:shadow-md hover:border-primary/20 cursor-pointer' 
      : '';
    
    return `${base} ${hoverEffect} ${this.className()}`.trim();
  });
}
