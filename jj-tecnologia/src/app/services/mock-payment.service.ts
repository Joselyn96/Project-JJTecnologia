import { Injectable, signal } from '@angular/core';

export interface PaymentConfig {
  amount: number;
  currency: string;
  title: string;
  description: string;
  email: string;
}

export interface MockToken {
  id: string;
  type: string;
  email: string;
  card_number: string;
  creation_date: number;
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'diners' | null;

@Injectable({
  providedIn: 'root'
})
export class MockPaymentService {

  isOpen = signal<boolean>(false);
  config = signal<PaymentConfig | null>(null);

  private onSuccessCallback?: (token: MockToken) => void;
  private onErrorCallback?: (error: any) => void;

  /**
   * Inicializar la configuración del checkout
   */
  initCheckout(
    config: PaymentConfig,
    onSuccess: (token: MockToken) => void,
    onError: (error: any) => void
  ): void {
    this.config.set(config);
    this.onSuccessCallback = onSuccess;
    this.onErrorCallback = onError;
  }

  /**
   * Abrir el modal de pago
   */
  open(): void {
    this.isOpen.set(true);
  }

  /**
   * Cerrar el modal de pago
   */
  close(): void {
    this.isOpen.set(false);
    this.config.set(null);
  }

  /**
   * Procesar el pago (simulado)
   */
  async processPayment(cardData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    email: string;
  }): Promise<void> {

    // Simular delay de procesamiento (1.5 segundos)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simular 95% de éxito
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      // Generar token mock
      const token: MockToken = {
        id: 'tkn_mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'card',
        email: cardData.email,
        card_number: cardData.cardNumber.slice(-4), // Solo últimos 4 dígitos
        creation_date: Date.now()
      };

      console.log('✅ Pago simulado exitoso:', token);

      if (this.onSuccessCallback) {
        this.onSuccessCallback(token);
      }
    } else {
      // Simular error
      const error = {
        user_message: 'Pago rechazado por el banco',
        merchant_message: 'Fondos insuficientes'
      };

      console.error('❌ Pago simulado rechazado:', error);

      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  /**
   * Detectar el tipo de tarjeta
   */
  detectCardType(cardNumber: string): CardType {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^2[2-7]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^3[068]/.test(cleaned)) return 'diners';

    return null;
  }

  /**
   * Validar número de tarjeta (algoritmo de Luhn)
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (!/^\d+$/.test(cleaned)) return false;
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Formatear número de tarjeta
   */
  formatCardNumber(cardNumber: string, cardType: CardType): string {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (cardType === 'amex') {
      // Amex: #### ###### #####
      return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    } else if (cardType === 'diners') {
      // Diners: #### ###### ####
      return cleaned.replace(/(\d{4})(\d{6})(\d{4})/, '$1 $2 $3');
    } else {
      // Visa/Mastercard: #### #### #### ####
      return cleaned.replace(/(\d{4})/g, '$1 ').trim();
    }
  }

  /**
   * Validar fecha de expiración
   */
  validateExpiry(month: string, year: string): boolean {
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos
    const currentMonth = now.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  }

  /**
   * Validar CVV
   */
  validateCVV(cvv: string, cardType: CardType): boolean {
    const expectedLength = cardType === 'amex' ? 4 : 3;
    return cvv.length === expectedLength && /^\d+$/.test(cvv);
  }
}
