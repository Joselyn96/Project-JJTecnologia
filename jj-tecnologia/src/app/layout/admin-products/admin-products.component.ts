import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService, Product } from '../../services/products.service';


@Component({
  selector: 'app-admin-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
   showModal = signal(false);
  isEditing = signal(false);
  searchTerm = signal('');
  selectedFile = signal<File | null>(null);
  uploadingImage = signal(false);
  imagePreview = signal<string>('');
  
  currentProduct = signal<Product>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    stock: 0,
    active: true,
    category_id: undefined,
    image_url: ''
  });

  constructor(public productsService: ProductsService) {}

  async ngOnInit() {
    await this.productsService.loadProducts();
    await this.productsService.loadCategories();
  }

  get filteredProducts() {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.productsService.products();
    
    return this.productsService.products().filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term)
    );
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.selectedFile.set(null);
    this.imagePreview.set('');
    this.currentProduct.set({
      name: '',
      sku: '',
      description: '',
      price: 0,
      stock: 0,
      active: true,
      category_id: undefined,
      image_url: ''
    });
    this.showModal.set(true);
  }

  openEditModal(product: Product) {
    this.isEditing.set(true);
    this.selectedFile.set(null);
    this.imagePreview.set(product.image_url || '');
    this.currentProduct.set({ ...product });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFile.set(null);
    this.imagePreview.set('');
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      
      this.selectedFile.set(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile.set(null);
    this.imagePreview.set('');
    this.currentProduct.update(p => ({ ...p, image_url: '' }));
  }

  async handleSubmit() {
    try {
      this.uploadingImage.set(true);
      const product = this.currentProduct();
      
      // Si hay un archivo seleccionado, subirlo primero
      if (this.selectedFile()) {
        const imageUrl = await this.productsService.uploadImage(this.selectedFile()!);
        product.image_url = imageUrl;
      }
      
      if (this.isEditing() && product.id) {
        await this.productsService.updateProduct(product.id, product);
      } else {
        await this.productsService.createProduct(product);
      }
      
      this.closeModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.message || 'Error al guardar el producto');
    } finally {
      this.uploadingImage.set(false);
    }
  }

  async handleDelete(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await this.productsService.deleteProduct(id);
      } catch (error: any) {
        console.error('Error deleting product:', error);
        alert(error.message || 'Error al eliminar el producto');
      }
    }
  }

  async toggleStatus(product: Product) {
    try {
      await this.productsService.toggleProductStatus(product.id!, !product.active);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(error.message || 'Error al cambiar el estado');
    }
  }

  getCategoryName(categoryId?: number): string {
    if (!categoryId) return 'Sin categoría';
    const category = this.productsService.categories().find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  }
}
