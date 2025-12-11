import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockPaymentService, CardType } from '../../../services/mock-payment.service';

@Component({
  selector: 'app-payment-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-modal.component.html',
  styleUrl: './payment-modal.component.css'
})
export class PaymentModalComponent {
  paymentService = inject(MockPaymentService);

  // Form fields
  cardNumber = signal<string>('');
  expiry = signal<string>('');
  cvv = signal<string>('');
  email = signal<string>('');

  // Processing state
  isProcessing = signal<boolean>(false);

  // Computed
  cardType = computed<CardType>(() =>
    this.paymentService.detectCardType(this.cardNumber())
  );

  cvvMaxLength = computed(() =>
    this.cardType() === 'amex' ? 4 : 3
  );

  // Validations
  cardNumberError = signal<string>('');
  expiryError = signal<string>('');
  cvvError = signal<string>('');
  emailError = signal<string>('');

  cardNumberClass = computed(() => {
    const base = '';
    if (this.cardNumber() && this.cardNumberError()) return base + ' border-red-500';
    if (this.cardNumber() && !this.cardNumberError()) return base + ' border-green-500';
    return base + ' border-gray-300';
  });

  expiryClass = computed(() => {
    const base = '';
    if (this.expiry() && this.expiryError()) return base + ' border-red-500';
    if (this.expiry() && !this.expiryError()) return base + ' border-green-500';
    return base + ' border-gray-300';
  });

  cvvClass = computed(() => {
    const base = '';
    if (this.cvv() && this.cvvError()) return base + ' border-red-500';
    if (this.cvv() && !this.cvvError()) return base + ' border-green-500';
    return base + ' border-gray-300';
  });

  emailClass = computed(() => {
    const base = '';
    if (this.email() && this.emailError()) return base + ' border-red-500';
    if (this.email() && !this.emailError()) return base + ' border-green-500';
    return base + ' border-gray-300';
  });

  constructor() {
    // Pre-llenar email si está disponible
    const config = this.paymentService.config();
    if (config?.email) {
      this.email.set(config.email);
    }
  }

  onCardNumberChange(): void {
    let value = this.cardNumber();

    // Permitir solo números y espacios
    value = value.replace(/[^\d\s]/g, '');

    // Formatear automáticamente
    const cardType = this.paymentService.detectCardType(value);
    const formatted = this.paymentService.formatCardNumber(value, cardType);

    this.cardNumber.set(formatted);

    // Validar
    if (value.replace(/\s/g, '').length >= 13) {
      const isValid = this.paymentService.validateCardNumber(value);
      this.cardNumberError.set(isValid ? '' : 'Número de tarjeta inválido');
    } else {
      this.cardNumberError.set('');
    }
  }

  onExpiryChange(): void {
    let value = this.expiry();

    // Permitir solo números
    value = value.replace(/\D/g, '');

    // Formatear MM/YY automáticamente
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }

    this.expiry.set(value);

    // Validar si está completo
    if (value.length === 5) {
      const [month, year] = value.split('/');
      const isValid = this.paymentService.validateExpiry(month, year);
      this.expiryError.set(isValid ? '' : 'Fecha de expiración inválida');
    } else {
      this.expiryError.set('');
    }
  }

  onCvvChange(): void {
    let value = this.cvv();

    // Permitir solo números
    value = value.replace(/\D/g, '');

    this.cvv.set(value);

    // Validar
    const expectedLength = this.cvvMaxLength();
    if (value.length === expectedLength) {
      const isValid = this.paymentService.validateCVV(value, this.cardType());
      this.cvvError.set(isValid ? '' : 'CVV inválido');
    } else {
      this.cvvError.set('');
    }
  }

  isFormValid(): boolean {
    const cardValid = this.cardNumber().replace(/\s/g, '').length >= 13 &&
      !this.cardNumberError() &&
      this.paymentService.validateCardNumber(this.cardNumber());

    const expiryValid = this.expiry().length === 5 && !this.expiryError();
    const cvvValid = this.cvv().length >= 3 && !this.cvvError();
    const emailValid = this.email().includes('@') && this.email().includes('.');

    return cardValid && expiryValid && cvvValid && emailValid;
  }

  async submitPayment(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isProcessing.set(true);

    const [month, year] = this.expiry().split('/');

    try {
      await this.paymentService.processPayment({
        cardNumber: this.cardNumber(),
        expiryMonth: month,
        expiryYear: year,
        cvv: this.cvv(),
        email: this.email()
      });

      // El servicio maneja el callback de éxito
      this.closeModal();
    } catch (error) {
      console.error('Error procesando pago:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  closeModal(): void {
    if (!this.isProcessing()) {
      this.paymentService.close();
      this.resetForm();
    }
  }

  resetForm(): void {
    this.cardNumber.set('');
    this.expiry.set('');
    this.cvv.set('');
    this.cardNumberError.set('');
    this.expiryError.set('');
    this.cvvError.set('');
    this.emailError.set('');
  }
}
