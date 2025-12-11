import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ProductsService, Product, Category } from '../../services/products.service';
import { CartService } from '../../services/cart.service';

type BadgeVariant = 'success' | 'warning' | 'danger';

// interface Product {
//   id: string;
//   name: string;
//   category: string;
//   brand: string;
//   price: number;
//   stock: number;
//   image: string;
//   description: string;
// }

@Component({
  selector: 'app-products',
  imports: [CommonModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    NavbarComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit{
  // Estado (filtros)
  selectedCategory = signal<'all' | number>('all');
  selectedBrand = signal<'all' | string>('all');
  priceRange = signal<[number, number]>([0, 10000]);
  maxPriceValue = signal(10000); // Valor máximo dinámico
  searchTerm = signal('');
  sortBy = signal<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');

  // Modal
  showModal = signal(false);
  selectedProduct = signal<Product | null>(null);

   // Notificación de producto agregado
  showNotification = signal(false);
  notificationMessage = signal('');

  // Brands únicos calculados desde los productos
  brands = computed<string[]>(() => {
    const allBrands = this.productsService.products()
      .map(p => this.getCategoryName(p.category_id))
      .filter((brand, index, self) => brand && self.indexOf(brand) === index);
    return allBrands as string[];
  });

  constructor(
    public productsService: ProductsService,
    private cartService: CartService
  ) {}

  async ngOnInit() {
    await this.productsService.loadProducts();
    await this.productsService.loadCategories();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Actualizar precio máximo basado en productos reales
    const maxPrice = Math.max(...this.productsService.products().map(p => p.price), 10000);
    this.maxPriceValue.set(maxPrice);
    this.priceRange.set([0, maxPrice]);
  }

  // Lista filtrada + ordenada
  filteredProducts = computed<Product[]>(() => {
    const category = this.selectedCategory();
    const brand = this.selectedBrand();
    const [minP, maxP] = this.priceRange();
    const term = this.searchTerm().toLowerCase();
    const sort = this.sortBy();

    // Solo mostrar productos activos
    let list = this.productsService.products().filter(p => p.active);

    // Aplicar filtros
    list = list.filter(p => {
      const matchesCategory = category === 'all' || p.category_id === category;
      const categoryName = this.getCategoryName(p.category_id);
      const matchesBrand = brand === 'all' || categoryName === brand;
      const matchesPrice = p.price >= minP && p.price <= maxP;
      const matchesSearch = p.name.toLowerCase().includes(term) || 
                           (p.description?.toLowerCase() || '').includes(term) ||
                           (p.sku?.toLowerCase() || '').includes(term);
      return matchesCategory && matchesBrand && matchesPrice && matchesSearch;
    });

    // Ordenar
    switch (sort) {
      case 'price-low':  
        list = [...list].sort((a, b) => a.price - b.price); 
        break;
      case 'price-high': 
        list = [...list].sort((a, b) => b.price - a.price); 
        break;
      case 'popular':    
        list = [...list].sort((a, b) => b.stock - a.stock); 
        break;
      case 'newest':
      default:           
        list = [...list].sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
    }

    return list;
  });

  // Helper para obtener nombre de categoría
  getCategoryName(categoryId?: number): string {
    if (!categoryId) return 'Sin categoría';
    const category = this.productsService.categories().find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }

  // Métodos del modal
  openProductDetail(product: Product) {
    this.selectedProduct.set(product);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedProduct.set(null);
  }

  // Agregar al carrito
  addToCart(product: Product, event?: Event) {
 if (event) {
    event.stopPropagation();
  }

  if (!product.id) {
    console.error('El producto no tiene ID');
    return;
  }

  if (product.stock === 0) {
    return;
  }

  // ✅ CAMBIAR ESTA LÓGICA
  const wasAdded = this.cartService.addToCart(product, 1);

  // Mostrar notificación solo si se agregó (no estaba en el carrito)
  if (wasAdded) {
    this.notificationMessage.set(`"${product.name}" agregado al carrito`);
    this.showNotification.set(true);

    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
      this.showNotification.set(false);
    }, 3000);
  } else {
    // Opcional: mostrar mensaje de que ya está en el carrito
    this.notificationMessage.set(`"${product.name}" ya está en el carrito`);
    this.showNotification.set(true);
    setTimeout(() => {
      this.showNotification.set(false);
    }, 3000);
  }
}

  // Verificar si producto está en carrito
  isInCart(productId: number | undefined): boolean {
  if (!productId) return false;
  return this.cartService.isInCart(productId);
}

  // Obtener cantidad en carrito
  getCartQuantity(productId: number | undefined): number {
  if (!productId) return 0;
  return this.cartService.getProductQuantity(productId);
}

  // UI helpers
  getStockBadgeVariant(stock: number): BadgeVariant {
    if (stock === 0) return 'danger';
    if (stock <= 5) return 'warning';
    return 'success';
  }

  // Handlers
  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(value);
  }

  onCategoryChange(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? 'all';
    this.selectedCategory.set(value === 'all' ? 'all' : Number(value));
  }

  onBrandChange(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? 'all';
    this.selectedBrand.set(value);
  }

  onPriceMaxInput(event: Event) {
    const val = Number.parseInt((event.target as HTMLInputElement | null)?.value ?? '0', 10);
    const [min] = this.priceRange();
    this.priceRange.set([min, isNaN(val) ? min : val]);
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement | null)?.value as
      | 'newest' | 'price-low' | 'price-high' | 'popular' | undefined;
    this.sortBy.set(value ?? 'newest');
  }

  clearFilters() {
    this.selectedCategory.set('all');
    this.selectedBrand.set('all');
    this.searchTerm.set('');
    const maxPrice = this.maxPriceValue();
    this.priceRange.set([0, maxPrice]);
    this.sortBy.set('newest');
  }

  trackById(_i: number, item: Product) {
    return item.id;
  }
}




//codigo antiguo estatico
// import { Component, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { BadgeComponent } from '../../shared/components/badge/badge.component';
// import { ButtonComponent } from '../../shared/components/button/button.component';
// import { CardComponent } from '../../shared/components/card/card.component';
// import { InputComponent } from '../../shared/components/input/input.component';
// import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

// type BadgeVariant = 'success' | 'warning' | 'danger';

// interface Product {
//   id: string;
//   name: string;
//   category: string;
//   brand: string;
//   price: number;
//   stock: number;
//   image: string;
//   description: string;
// }

// @Component({
//   selector: 'app-products',
//   imports: [CommonModule,
//     BadgeComponent,
//     ButtonComponent,
//     CardComponent,
//     InputComponent,
//     NavbarComponent],
//   templateUrl: './products.component.html',
//   styleUrl: './products.component.css'
// })
// export class ProductsComponent {
//  // Estado (filtros)
//   selectedCategory = signal<'all' | string>('all');
//   selectedBrand = signal<'all' | string>('all');
//   priceRange = signal<[number, number]>([0, 5000]);
//   searchTerm = signal('');
//   sortBy = signal<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');

//   // ← AGREGAR ESTADO DEL MODAL
//   showModal = signal(false);
//   selectedProduct = signal<Product | null>(null);

//   // Listas
//   categories = signal<string[]>(['Laptops', 'PCs', 'Impresoras', 'Cámaras', 'Accesorios']);
//   brands = signal<string[]>(['Samsung', 'Lenovo', 'ASUS', 'Acer', 'Dahua', 'Hikvision']);

//   // Datos (catálogo) - AGREGAR DESCRIPCIONES
//   allProducts = signal<Product[]>([
//     { 
//       id: '1', 
//       name: 'Laptop ASUS VivoBook 15', 
//       category: 'Laptops', 
//       brand: 'ASUS', 
//       price: 2499, 
//       stock: 5, 
//       image: '/LaptopASUSVivoBook15.jpg',
//       description: 'Laptop ultradelgada con procesador Intel Core i5 de 11va generación, 8GB RAM DDR4, SSD de 512GB. Pantalla Full HD de 15.6 pulgadas, ideal para trabajo y estudio.'
//     },
//     { 
//       id: '2', 
//       name: 'PC Gamer Lenovo Legion', 
//       category: 'PCs', 
//       brand: 'Lenovo', 
//       price: 3999, 
//       stock: 3, 
//       image: '/PCGamerLenLegion.jpg',
//       description: 'PC gaming de alto rendimiento con procesador AMD Ryzen 7, 16GB RAM, tarjeta gráfica NVIDIA RTX 3060, SSD 1TB. Perfecto para juegos AAA y streaming.'
//     },
//     { 
//       id: '3', 
//       name: 'Impresora HP LaserJet Pro', 
//       category: 'Impresoras', 
//       brand: 'HP', 
//       price: 1299, 
//       stock: 8, 
//       image: '/ImpresoraHPLaserJetPro.jpg',
//       description: 'Impresora láser monocromática con velocidad de 40 ppm, impresión dúplex automática, WiFi integrado. Ideal para oficinas pequeñas y medianas.'
//     },
//     { 
//       id: '4', 
//       name: 'Cámara CCTV Dahua 4MP', 
//       category: 'Cámaras', 
//       brand: 'Dahua', 
//       price: 599, 
//       stock: 12, 
//       image: '/CamaraCCTVDahua4MP.jpg',
//       description: 'Cámara de seguridad IP con resolución 4MP, visión nocturna hasta 30m, resistente al agua IP67, detección de movimiento inteligente.'
//     },
//     { 
//       id: '5', 
//       name: 'Monitor Samsung 27" 4K', 
//       category: 'Accesorios', 
//       brand: 'Samsung', 
//       price: 899, 
//       stock: 0, 
//       image: '/MonitorSamsung27.png',
//       description: 'Monitor profesional 4K UHD de 27 pulgadas, tecnología IPS, HDR10, frecuencia de 60Hz, puertos HDMI y DisplayPort. Perfecto para diseño y edición.'
//     },
//     { 
//       id: '6', 
//       name: 'Teclado Mecánico RGB', 
//       category: 'Accesorios', 
//       brand: 'ASUS', 
//       price: 349, 
//       stock: 15, 
//       image: '/TecladoMecánicoRGB.jpg',
//       description: 'Teclado mecánico gaming con switches Cherry MX Red, retroiluminación RGB personalizable, reposamuñecas magnético, teclas anti-ghosting.'
//     },
//     { 
//       id: '7', 
//       name: 'Laptop Lenovo ThinkPad', 
//       category: 'Laptops', 
//       brand: 'Lenovo', 
//       price: 2899, 
//       stock: 4, 
//       image: '/LaptopLenovoThinkPad.jpg',
//       description: 'Laptop empresarial con procesador Intel Core i7, 16GB RAM, SSD 512GB, pantalla 14" Full HD, teclado retroiluminado, certificación militar MIL-STD.'
//     },
//     { 
//       id: '8', 
//       name: 'PC Acer Aspire', 
//       category: 'PCs', 
//       brand: 'Acer', 
//       price: 1899, 
//       stock: 6, 
//       image: '/PCAcerAspire.jpg',
//       description: 'PC de escritorio con procesador Intel Core i5, 8GB RAM, disco duro 1TB + SSD 256GB, tarjeta gráfica integrada. Ideal para uso doméstico y oficina.'
//     },
//   ]);

//   // Lista filtrada + ordenada
//   filteredProducts = computed<Product[]>(() => {
//     const category = this.selectedCategory();
//     const brand = this.selectedBrand();
//     const [minP, maxP] = this.priceRange();
//     const term = this.searchTerm().toLowerCase();
//     const sort = this.sortBy();

//     let list = this.allProducts().filter(p => {
//       const matchesCategory = category === 'all' || p.category === category;
//       const matchesBrand = brand === 'all' || p.brand === brand;
//       const matchesPrice = p.price >= minP && p.price <= maxP;
//       const matchesSearch = p.name.toLowerCase().includes(term);
//       return matchesCategory && matchesBrand && matchesPrice && matchesSearch;
//     });

//     switch (sort) {
//       case 'price-low':  list = [...list].sort((a, b) => a.price - b.price); break;
//       case 'price-high': list = [...list].sort((a, b) => b.price - a.price); break;
//       case 'popular':    list = [...list].sort((a, b) => b.stock - a.stock); break;
//       case 'newest':
//       default:           list = [...list].sort((a, b) => Number(b.id) - Number(a.id));
//     }

//     return list;
//   });

//   // ← AGREGAR MÉTODOS DEL MODAL
//   openProductDetail(product: Product) {
//     this.selectedProduct.set(product);
//     this.showModal.set(true);
//   }

//   closeModal() {
//     this.showModal.set(false);
//     this.selectedProduct.set(null);
//   }

//   // UI helpers
//   getStockBadgeVariant(stock: number): BadgeVariant {
//     if (stock === 0) return 'danger';
//     if (stock <= 5) return 'warning';
//     return 'success';
//   }

//   // Handlers
//   onSearchInput(event: Event) {
//     const value = (event.target as HTMLInputElement | null)?.value ?? '';
//     this.searchTerm.set(value);
//   }

//   onCategoryChange(event: Event) {
//     const value = (event.target as HTMLInputElement | null)?.value ?? 'all';
//     this.selectedCategory.set(value);
//   }

//   onBrandChange(event: Event) {
//     const value = (event.target as HTMLInputElement | null)?.value ?? 'all';
//     this.selectedBrand.set(value);
//   }

//   onPriceMaxInput(event: Event) {
//     const val = Number.parseInt((event.target as HTMLInputElement | null)?.value ?? '0', 10);
//     const [min] = this.priceRange();
//     this.priceRange.set([min, isNaN(val) ? 0 : val]);
//   }

//   onSortChange(event: Event) {
//     const value = (event.target as HTMLSelectElement | null)?.value as
//       | 'newest' | 'price-low' | 'price-high' | 'popular' | undefined;
//     this.sortBy.set(value ?? 'newest');
//   }

//   clearFilters() {
//     this.selectedCategory.set('all');
//     this.selectedBrand.set('all');
//     this.searchTerm.set('');
//     this.priceRange.set([0, 5000]);
//     this.sortBy.set('newest');
//   }

//   trackById(_i: number, item: Product) {
//     return item.id;
//   }
// }
