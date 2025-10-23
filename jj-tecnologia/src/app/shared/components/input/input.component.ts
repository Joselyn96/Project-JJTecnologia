import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
})
export class InputComponent {
  @Input() label?: string;
  @Input() error?: string;
  @Input() helperText?: string;
  @Input() icon?: string; // Material icon name like 'search', 'person', etc.
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() value: string = '';
  @Input() className: string = '';

  @Output() valueChange = new EventEmitter<string>();

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  }

  getInputClasses(): string {
    let classes = 'w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

    if (this.icon) {
      classes += ' pl-10';
    }

    if (this.error) {
      classes += ' border-red-500 focus:border-red-500 focus:ring-red-500/20';
    }

    if (this.disabled) {
      classes += ' opacity-60 cursor-not-allowed bg-gray-50';
    }

    if (this.className) {
      classes += ' ' + this.className;
    }

    return classes;
  }
}
