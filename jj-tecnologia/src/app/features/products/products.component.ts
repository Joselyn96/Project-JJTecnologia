import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

type BadgeVariant = 'success' | 'warning' | 'danger';

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  image: string;
}

@Component({
  selector: 'app-products',
  imports: [CommonModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    ModalComponent,
    NavbarComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
 // Estado (filtros)
  selectedCategory = signal<'all' | string>('all');
  selectedBrand = signal<'all' | string>('all');
  priceRange = signal<[number, number]>([0, 5000]); // [min, max]
  searchTerm = signal('');
  sortBy = signal<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');

  // Listas
  categories = signal<string[]>(['Laptops', 'PCs', 'Impresoras', 'Cámaras', 'Accesorios']);
  brands = signal<string[]>(['Samsung', 'Lenovo', 'ASUS', 'Acer', 'Dahua', 'Hikvision']);

  // Datos (catálogo)
  allProducts = signal<Product[]>([
    { id: '1', name: 'Laptop ASUS VivoBook 15', category: 'Laptops', brand: 'ASUS', price: 2499, stock: 5, image: '/LaptopASUSVivoBook15.jpg'},
    { id: '2', name: 'PC Gamer Lenovo Legion', category: 'PCs', brand: 'Lenovo', price: 3999, stock: 3, image: '/PCGamerLenLegion.jpg' },
    { id: '3', name: 'Impresora HP LaserJet Pro', category: 'Impresoras', brand: 'HP', price: 1299, stock: 8, image: '/ImpresoraHPLaserJetPro.jpg' },
    { id: '4', name: 'Cámara CCTV Dahua 4MP', category: 'Cámaras', brand: 'Dahua', price: 599, stock: 12, image: '/CamaraCCTVDahua4MP.jpg' },
    { id: '5', name: 'Monitor Samsung 27" 4K', category: 'Accesorios', brand: 'Samsung', price: 899, stock: 0, image: '/computer-monitor.png' },
    { id: '6', name: 'Teclado Mecánico RGB', category: 'Accesorios', brand: 'ASUS', price: 349, stock: 15, image: '/TecladoMecánicoRGB.jpg' },
    { id: '7', name: 'Laptop Lenovo ThinkPad', category: 'Laptops', brand: 'Lenovo', price: 2899, stock: 4, image: '/LaptopLenovoThinkPad.jpg' },
    { id: '8', name: 'PC Acer Aspire', category: 'PCs', brand: 'Acer', price: 1899, stock: 6, image: '/PCAcerAspire.jpg' },
  ]);

  // Lista filtrada + ordenada
  filteredProducts = computed<Product[]>(() => {
    const category = this.selectedCategory();
    const brand = this.selectedBrand();
    const [minP, maxP] = this.priceRange();
    const term = this.searchTerm().toLowerCase();
    const sort = this.sortBy();

    let list = this.allProducts().filter(p => {
      const matchesCategory = category === 'all' || p.category === category;
      const matchesBrand = brand === 'all' || p.brand === brand;
      const matchesPrice = p.price >= minP && p.price <= maxP;
      const matchesSearch = p.name.toLowerCase().includes(term);
      return matchesCategory && matchesBrand && matchesPrice && matchesSearch;
    });

    switch (sort) {
      case 'price-low':  list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-high': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'popular':    list = [...list].sort((a, b) => b.stock - a.stock); break; // placeholder
      case 'newest':
      default:           list = [...list].sort((a, b) => Number(b.id) - Number(a.id));
    }

    return list;
  });

  // UI helpers
  getStockBadgeVariant(stock: number): BadgeVariant {
    if (stock === 0) return 'danger';
    if (stock <= 5) return 'warning';
    return 'success';
  }

  // Handlers (evitan casts en el template)
  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchTerm.set(value);
  }

  onCategoryChange(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? 'all';
    this.selectedCategory.set(value);
  }

  onBrandChange(event: Event) {
    const value = (event.target as HTMLInputElement | null)?.value ?? 'all';
    this.selectedBrand.set(value);
  }

  onPriceMaxInput(event: Event) {
    const val = Number.parseInt((event.target as HTMLInputElement | null)?.value ?? '0', 10);
    const [min] = this.priceRange();
    this.priceRange.set([min, isNaN(val) ? 0 : val]);
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
    this.priceRange.set([0, 5000]);
    this.sortBy.set('newest');
  }

  trackById(_i: number, item: Product) {
    return item.id;
  }
}
