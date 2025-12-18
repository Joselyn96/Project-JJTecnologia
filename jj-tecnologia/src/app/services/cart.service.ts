import { Injectable, signal, computed } from '@angular/core';
import { Product } from './products.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Estado del carrito
  private cartItems = signal<CartItem[]>([]);

  // Computed signals
  cartCount = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  });

  uniqueItemsCount = computed(() => {
    return this.cartItems().length;
  });

  cartTotal = computed(() => {
    return this.cartItems().reduce((total, item) =>
      total + (item.product.price * item.quantity), 0
    );
  });

  constructor() {
    this.loadCartFromStorage();
  }

  // Obtener todos los items del carrito
  getCartItems() {
    return this.cartItems();
  }

  // ✅ AGREGAR ESTE MÉTODO COMPLETO
  addToCart(product: Product, quantity: number = 1) {
    // Validación: el producto debe tener ID
    if (!product.id) {
      console.error('Producto sin ID');
      return false;
    }

    const currentItems = this.cartItems();
    const existingItemIndex = currentItems.findIndex(
      item => item.product.id === product.id
    );

    if (existingItemIndex >= 0) {
      return false; // Indica que no se agregó porque ya existe
    }

    // Si es un producto nuevo, agregarlo al carrito
    this.cartItems.set([...currentItems, { product, quantity }]);
    this.saveCartToStorage();
    return true; // Indica que se agregó exitosamente
  }

  // Actualizar cantidad de un producto
  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentItems = this.cartItems();
    const updatedItems = currentItems.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    );
    this.cartItems.set(updatedItems);
    this.saveCartToStorage();
  }

  // Eliminar producto del carrito
  removeFromCart(productId: number) {
    const currentItems = this.cartItems();
    const updatedItems = currentItems.filter(
      item => item.product.id !== productId
    );
    this.cartItems.set(updatedItems);
    this.saveCartToStorage();
  }

  // Limpiar todo el carrito
  clearCart() {
    this.cartItems.set([]);
    this.saveCartToStorage();
  }


  isInCart(productId: number | undefined): boolean {
    if (!productId) return false;
    return this.cartItems().some(item => item.product.id === productId);
  }


  getProductQuantity(productId: number | undefined): number {
    if (!productId) return 0;
    const item = this.cartItems().find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }

  // Guardar carrito en localStorage
  private saveCartToStorage() {
    try {
      const cartData = this.cartItems().map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        product: item.product
      }));
      localStorage.setItem('cart', JSON.stringify(cartData));
    } catch (error) {
      console.error('Error al guardar el carrito:', error);
    }
  }

  // Cargar carrito desde localStorage
  private loadCartFromStorage() {
    try {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        const items = JSON.parse(cartData) as CartItem[];
        this.cartItems.set(items);
      }
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      this.cartItems.set([]);
    }
  }

  public clearCartOnLogout() {
  this.cartItems.set([]);
  localStorage.removeItem('cart');
  console.log('🛒 Carrito limpiado por cierre de sesión');
}
}
