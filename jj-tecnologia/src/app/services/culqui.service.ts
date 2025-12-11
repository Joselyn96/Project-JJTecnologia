import { Injectable } from '@angular/core';

declare var CulqiCheckout: any;

export interface CulqiConfig {
  amount: number;
  currency: string;
  title: string;
  description: string;
  email: string;
}

export interface CulqiToken {
  id: string;
  type: string;
  email: string;
  creation_date: number;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: {
    object: string;
    bin: string;
    card_brand: string;
    card_type: string;
    card_category: string;
    issuer: {
      name: string;
      country: string;
      country_code: string;
    };
    installments_allowed: number[];
  };
  client: {
    ip: string;
    ip_country: string;
    ip_country_code: string;
    browser: string;
    device_fingerprint: string;
    device_type: string;
  };
  metadata: any;
}

@Injectable({
  providedIn: 'root'
})
export class CulquiService {
  private culqiInstance: any;
  private publicKey = 'pk_test_90667d0a57d45c97'; // Llave pública de prueba
  constructor() { }

  /**
   * Inicializar Culqi Checkout
   */
  initCheckout(config: CulqiConfig, onSuccess: (token: CulqiToken) => void, onError: (error: any) => void): void {

    // Convertir el monto a céntimos (Culqi espera en céntimos)
    const amountInCents = Math.round(config.amount * 100);

    const settings = {
      title: config.title,
      currency: config.currency,
      amount: amountInCents,
    };

    const paymentMethods = {
      tarjeta: true,
      yape: false,
      billetera: false,
      bancaMovil: false,
      agente: false,
      cuotealo: false,
    };

    const options = {
      lang: 'es',
      installments: false,
      modal: true,
      paymentMethods: paymentMethods,
      paymentMethodsSort: Object.keys(paymentMethods),
    };

    const client = {
      email: config.email,
    };

    const appearance = {
      theme: 'default',
      hiddenCulqiLogo: false,
      hiddenBannerContent: false,
      hiddenBanner: false,
      hiddenToolBarAmount: false,
      menuType: 'sidebar',
      buttonCardPayText: 'Pagar',
      logo: null,
      defaultStyle: {
        bannerColor: '#3C5F94',
        buttonBackground: '#3C5F94',
        menuColor: '#3C5F94',
        linksColor: '#3C5F94',
        buttonTextColor: '#FFFFFF',
        priceColor: '#3C5F94',
      },
    };

    const culqiConfig = {
      settings,
      client,
      options,
      appearance,
    };

    // Handler para el resultado de Culqi
    const handleCulqiAction = () => {
      if (this.culqiInstance.token) {
        const token = this.culqiInstance.token;
        console.log('Token generado:', token);
        onSuccess(token);
      } else if (this.culqiInstance.order) {
        console.log('Order generada:', this.culqiInstance.order);
      } else {
        console.error('Error de Culqi:', this.culqiInstance.error);
        onError(this.culqiInstance.error);
      }
    };

    // Crear instancia de Culqi
    this.culqiInstance = new CulqiCheckout(this.publicKey, culqiConfig);
    this.culqiInstance.culqi = handleCulqiAction;
  }

  /**
   * Abrir el modal de Culqi
   */
  open(): void {
    if (this.culqiInstance) {
      this.culqiInstance.open();
    } else {
      console.error('Culqi no está inicializado. Llama primero a initCheckout()');
    }
  }

  /**
   * Cerrar el modal de Culqi
   */
  close(): void {
    if (this.culqiInstance) {
      this.culqiInstance.close();
    }
  }
}
