import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CheckoutStep, ShippingAddress, CheckoutData } from './checkout.interface';
import { AuthModalComponent } from '../../shared/components/auth-modal/auth-modal.component';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { MockPaymentService, MockToken } from '../../services/mock-payment.service';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';
import { reniec } from 'ubigeo-peru';
import { ReceiptService } from '../../services/receipt.service';
import { generateOrderNumber } from '../../utils/order-number.util';

interface UbigeoItem {
  departamento: string;
  provincia: string;
  distrito: string;
  nombre: string;
}

function getDepartamentos() {
  const departamentos = new Map<string, string>();
  (reniec as UbigeoItem[]).forEach((item: UbigeoItem) => {
    // Solo procesar registros donde provincia y distrito son '00' (son los departamentos)
    if (item.provincia === '00' && item.distrito === '00') {
      departamentos.set(item.departamento, item.nombre);
    }
  });
  return Array.from(departamentos, ([codigo, nombre]) => ({ codigo, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function getProvinciasByDepartamento(codigoDepartamento: string) {
  const provincias = new Map<string, string>();
  (reniec as UbigeoItem[])
    .filter((item: UbigeoItem) => item.departamento === codigoDepartamento && item.distrito === '00')
    .forEach((item: UbigeoItem) => {
      provincias.set(item.provincia, item.nombre.split('/')[1]?.trim() || item.nombre);
    });
  return Array.from(provincias, ([codigo, nombre]) => ({ codigo, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function getDistritosByProvincia(codigoDepartamento: string, codigoProvincia: string) {
  return (reniec as UbigeoItem[])
    .filter((item: UbigeoItem) =>
      item.departamento === codigoDepartamento &&
      item.provincia === codigoProvincia &&
      item.distrito !== '00'
    )
    .map((item: UbigeoItem) => ({
      codigo: item.distrito,
      nombre: item.nombre.split('/')[2]?.trim() || item.nombre
    }))
    .sort((a: { nombre: string }, b: { nombre: string }) => a.nombre.localeCompare(b.nombre));
}

@Component({
  selector: 'app-customer-cart',
  imports: [CommonModule, ButtonComponent, CardComponent, NavbarComponent, AuthModalComponent, FormsModule, ReactiveFormsModule, PaymentModalComponent],
  templateUrl: './customer-cart.component.html',
  styleUrl: './customer-cart.component.css'
})
export class CustomerCartComponent {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private mockPaymentService = inject(MockPaymentService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private receiptService = inject(ReceiptService);

  // Computed signals del carrito
  cartItems = computed(() => this.cartService.getCartItems());
  cartTotal = computed(() => this.cartService.cartTotal());
  cartCount = computed(() => this.cartService.cartCount());

  // UBIGEO DATA
  // ========================================
  departamentos = signal(getDepartamentos());
  provincias = signal<{ codigo: string; nombre: string }[]>([]);
  distritos = signal<{ codigo: string; nombre: string }[]>([]);

  // Códigos seleccionados (para enviar a la BD)
  selectedDepartamentoCodigo = signal<string>('');
  selectedProvinciaCodigo = signal<string>('');
  selectedDistritoCodigo = signal<string>('');

  // Estado del checkout
  checkoutStep = signal<CheckoutStep>(CheckoutStep.SUMMARY);
  CheckoutStep = CheckoutStep; // Para usar en el template

  // Control del modal de autenticación
  showAuthModal = signal<boolean>(false);

  // Usuario actual
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;

  // Formulario de dirección
  shippingForm: FormGroup;

  // Datos del checkout
  checkoutData = signal<CheckoutData | null>(null);
  // Orden creada
  createdOrder = signal<any>(null);

  // Estado de procesamiento
  isProcessingPayment = signal<boolean>(false);

  // Token de Culqi
  culqiToken = signal<string | null>(null);

  constructor() {
    this.shippingForm = this.fb.group({
      shipping_address: ['', [Validators.required, Validators.minLength(10)]],
      district: ['', Validators.required],
      province: ['', Validators.required],
      department: ['', Validators.required],
      reference: ['']
    });
    // ========================================
    // LISTENERS PARA CASCADA DE SELECTS
    // ========================================

    // Cuando cambia el departamento
    this.shippingForm.get('department')?.valueChanges.subscribe(codigoDepartamento => {
      if (codigoDepartamento) {
        this.selectedDepartamentoCodigo.set(codigoDepartamento);
        this.provincias.set(getProvinciasByDepartamento(codigoDepartamento));
        this.distritos.set([]);
        this.shippingForm.patchValue({ province: '', district: '' }, { emitEvent: false });
      } else {
        this.provincias.set([]);
        this.distritos.set([]);
      }
    });

    // Cuando cambia la provincia
    this.shippingForm.get('province')?.valueChanges.subscribe(codigoProvincia => {
      const codigoDepartamento = this.selectedDepartamentoCodigo();
      if (codigoDepartamento && codigoProvincia) {
        this.selectedProvinciaCodigo.set(codigoProvincia);
        this.distritos.set(getDistritosByProvincia(codigoDepartamento, codigoProvincia));
        this.shippingForm.patchValue({ district: '' }, { emitEvent: false });
      } else {
        this.distritos.set([]);
      }
    });

    // Cuando cambia el distrito
    this.shippingForm.get('district')?.valueChanges.subscribe(codigoDistrito => {
      if (codigoDistrito) {
        this.selectedDistritoCodigo.set(codigoDistrito);
      }
    });
  }

  // ==========================================
  // MÉTODOS DEL CARRITO (existentes)
  // ==========================================

  // Calcular subtotal por item
  getItemSubtotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  // Manejar cambio de cantidad desde input
  onQuantityChange(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);

    if (!isNaN(newQuantity) && newQuantity > 0) {
      this.updateQuantity(productId, newQuantity);
    }
  }

  // Actualizar cantidad
  updateQuantity(productId: number, newQuantity: number) {
    if (newQuantity < 1) return;

    const item = this.cartItems().find(i => i.product.id === productId);
    if (!item) return;

    // Verificar stock
    if (newQuantity > item.product.stock) {
      alert(`Solo hay ${item.product.stock} unidades disponibles`);
      return;
    }

    this.cartService.updateQuantity(productId, newQuantity);
  }

  // Incrementar cantidad
  incrementQuantity(productId: number) {
    const item = this.cartItems().find(i => i.product.id === productId);
    if (!item) return;

    this.updateQuantity(productId, item.quantity + 1);
  }

  // Decrementar cantidad
  decrementQuantity(productId: number) {
    const item = this.cartItems().find(i => i.product.id === productId);
    if (!item) return;

    if (item.quantity <= 1) {
      this.removeItem(productId);
      return;
    }

    this.updateQuantity(productId, item.quantity - 1);
  }

  // Eliminar item
  removeItem(productId: number) {
    if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  // Vaciar carrito
  clearCart() {
    if (confirm('¿Estás seguro de vaciar todo el carrito?')) {
      this.cartService.clearCart();
    }
  }

  // Continuar comprando
  continueShopping() {
    this.router.navigate(['/products']);
  }

  // ==========================================
  // MÉTODOS DEL CHECKOUT (NUEVOS)
  // ==========================================

  proceedToCheckout() {
    if (this.cartCount() === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Verificar si está autenticado
    if (!this.isAuthenticated()) {
      this.checkoutStep.set(CheckoutStep.LOGIN);
    } else {
      this.checkoutStep.set(CheckoutStep.SHIPPING);
    }
  }

  openAuthModal(): void {
    this.showAuthModal.set(true);
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);

    // Después de cerrar el modal, verificar si se autenticó
    if (this.isAuthenticated()) {
      // Usuario se logueó exitosamente, continuar al checkout
      this.checkoutStep.set(CheckoutStep.SHIPPING);
    } else {
      // Usuario cerró el modal sin loguearse, volver al resumen
      this.checkoutStep.set(CheckoutStep.SUMMARY);
    }
  }

  goBackToSummary(): void {
    // Guardar datos del formulario antes de volver
    if (this.shippingForm.dirty) {
      // El formulario tiene cambios, no lo resetees
    }
    this.checkoutStep.set(CheckoutStep.SUMMARY);
  }

  submitShippingAddress(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    // Obtener los nombres completos basados en los códigos seleccionados
    const departamentoNombre = this.departamentos().find(d => d.codigo === this.selectedDepartamentoCodigo())?.nombre || '';
    const provinciaNombre = this.provincias().find(p => p.codigo === this.selectedProvinciaCodigo())?.nombre || '';
    const distritoNombre = this.distritos().find(d => d.codigo === this.selectedDistritoCodigo())?.nombre || '';

    // Calcular costos
    const subtotal = this.cartTotal();
    const shipping_cost = 0;
    const total = subtotal + shipping_cost;

    // Guardar datos del checkout con NOMBRES (no códigos)
    this.checkoutData.set({
      shipping_address: this.shippingForm.value.shipping_address,
      department: departamentoNombre,
      province: provinciaNombre,
      district: distritoNombre,
      reference: this.shippingForm.value.reference || '',
      subtotal,
      shipping_cost,
      total
    });

    // Ir a confirmación
    this.checkoutStep.set(CheckoutStep.CONFIRMATION);
  }

  confirmOrder(): void {
    const checkoutInfo = this.checkoutData();
    if (!checkoutInfo) {
      alert('Error: Datos de checkout no disponibles');
      return;
    }

    const userEmail = this.currentUser()?.email || 'test@test.com';

    this.checkoutStep.set(CheckoutStep.PAYMENT);

    // Dar tiempo para que se renderice el paso PAYMENT
    setTimeout(() => {
      this.initCulqiCheckout(checkoutInfo.total, userEmail);
    }, 500);
  }

  goBackToShipping(): void {
    const data = this.checkoutData();
    if (data) {
      // Buscar los códigos basados en los nombres guardados
      const departamento = this.departamentos().find(d => d.nombre === data.department);

      if (departamento) {
        this.selectedDepartamentoCodigo.set(departamento.codigo);
        this.provincias.set(getProvinciasByDepartamento(departamento.codigo));

        const provincia = this.provincias().find(p => p.nombre === data.province);

        if (provincia) {
          this.selectedProvinciaCodigo.set(provincia.codigo);
          this.distritos.set(getDistritosByProvincia(departamento.codigo, provincia.codigo));

          const distrito = this.distritos().find(d => d.nombre === data.district);

          if (distrito) {
            this.selectedDistritoCodigo.set(distrito.codigo);
          }
        }
      }

      // Restaurar valores en el formulario
      this.shippingForm.patchValue({
        shipping_address: data.shipping_address,
        department: departamento?.codigo || '',
        province: this.provincias().find(p => p.nombre === data.province)?.codigo || '',
        district: this.distritos().find(d => d.nombre === data.district)?.codigo || '',
        reference: data.reference
      });
    }

    this.checkoutStep.set(CheckoutStep.SHIPPING);
  }

  // Helpers para el formulario
  isFieldInvalid(fieldName: string): boolean {
    const field = this.shippingForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.shippingForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      return 'La dirección debe tener al menos 10 caracteres';
    }
    return '';
  }

  // ==========================================
  // MÉTODOS DE PAGO CON CULQI
  // ==========================================

  initCulqiCheckout(amount: number, email: string): void {
    this.mockPaymentService.initCheckout(
      {
        amount: amount,
        currency: 'S/',
        title: 'Pago de pedido',
        description: 'Compra en tienda online',
        email: email
      },
      (token: MockToken) => {
        console.log('✅ Token recibido:', token);
        this.culqiToken.set(token.id);
        this.mockPaymentService.close();
        this.processPaymentWithToken(token.id);
      },
      (error: any) => {
        console.error('❌ Error de pago:', error);
        alert('Error al procesar el pago: ' + (error.user_message || 'Error desconocido'));
        this.checkoutStep.set(CheckoutStep.CONFIRMATION);
      }
    );

    this.mockPaymentService.open();
  }

  async processPaymentWithToken(token: string): Promise<void> {
    this.isProcessingPayment.set(true);

    const checkoutInfo = this.checkoutData();
    if (!checkoutInfo) {
      alert('Error: Datos de checkout no disponibles');
      this.isProcessingPayment.set(false);
      return;
    }

    const paymentResult = await this.orderService.processPayment(
      token,
      checkoutInfo.total
    );

    if (paymentResult.success) {
      await this.createOrderInDatabase();
    } else {
      this.isProcessingPayment.set(false);
      alert('Pago rechazado: ' + (paymentResult.error || 'Error desconocido'));
      this.checkoutStep.set(CheckoutStep.CONFIRMATION);
    }
  }

  async createOrderInDatabase(): Promise<void> {
    const userId = this.currentUser()?.id;

  if (!userId) {
    alert('Error: Usuario no autenticado');
    this.checkoutStep.set(CheckoutStep.LOGIN);
    this.isProcessingPayment.set(false);
    return;
  }

  const checkoutInfo = this.checkoutData();
  if (!checkoutInfo) {
    alert('Error: Datos de checkout no disponibles');
    this.isProcessingPayment.set(false);
    return;
  }

  const items = this.cartItems().map(item => ({
    product_id: item.product.id!,
    quantity: item.quantity,
    price: item.product.price,
    product_name: item.product.name,
    product_sku: item.product.sku || `SKU-${item.product.id}`
  }));

  // 1. Crear la orden en la base de datos
  const result = await this.orderService.createOrder({
    user_id: userId,
    items: items,
    shipping_address: checkoutInfo.shipping_address,
    district: checkoutInfo.district,
    province: checkoutInfo.province,
    department: checkoutInfo.department,
    reference: checkoutInfo.reference,
    subtotal: checkoutInfo.subtotal,
    shipping_cost: checkoutInfo.shipping_cost,
    total_amount: checkoutInfo.total,
    payment_method: 'TARJETA',
  });

  this.isProcessingPayment.set(false);

  if (result.success && result.order) {
    // ========================================
    // 🆕 GENERAR Y GUARDAR PDF (NUEVO CÓDIGO)
    // ========================================
    try {
      const order = result.order;
      const userEmail = this.currentUser()?.email || '';

      // 2. Generar número de orden formateado
      const orderNumber = generateOrderNumber(order.id, order.created_at);
      console.log('📄 Número de orden:', orderNumber);

      // 3. Generar PDF y subir a Supabase Storage
      const receiptUrl = await this.receiptService.generateAndSave({
        order: order,
        orderNumber: orderNumber,
        items: this.cartItems(),
        userEmail: userEmail
      });

      // 4. Si se generó el PDF correctamente, guardar URL y descargar
      if (receiptUrl) {
        await this.orderService.updateReceiptUrl(order.id, receiptUrl);
        this.receiptService.downloadPDF(receiptUrl, orderNumber);
        console.log('✅ Boleta generada:', orderNumber);
      } else {
        console.warn('⚠️ No se pudo generar la boleta');
      }
    } catch (error) {
      console.error('❌ Error generando boleta:', error);
      // No detenemos el flujo, la orden ya se creó
    }
    // ========================================
    // FIN DEL CÓDIGO NUEVO
    // ========================================

    // 5. Continuar con el flujo normal (como estaba antes)
    this.createdOrder.set(result.order);
    this.cartService.clearCart();
    this.checkoutStep.set(CheckoutStep.SUCCESS);
  } else {
    alert('Error al crear la orden: ' + (result.error || 'Error desconocido'));
    this.checkoutStep.set(CheckoutStep.CONFIRMATION);
  }
  }
  viewOrder(): void {
    const orderId = this.createdOrder()?.id;
    if (orderId) {
      this.router.navigate(['/orders', orderId]);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
