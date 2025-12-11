import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

export interface Product {
  id?: number;
  category_id?: number;
  name: string;
  sku: string;
  description?: string;
  image_url?: string;
  price: number;
  stock: number;
  active: boolean;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
private supabase: SupabaseClient;
  
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async loadProducts() {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.products.set(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCategories() {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      this.categories.set(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  async createProduct(product: Product) {
    const { data, error } = await this.supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    await this.loadProducts();
    return data;
  }

  async updateProduct(id: number, product: Partial<Product>) {
    console.log('🔍 Intentando actualizar:', { id, product });
  
  const { data, error } = await this.supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select();

  console.log('📊 Respuesta Supabase:', { data, error });

  if (error) {
    console.error('❌ Error updating product:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('⚠️ No se devolvieron filas. Verificar RLS o ID');
    throw new Error('No se pudo actualizar el producto');
  }

  await this.loadProducts();
  return data[0];
  }

  async deleteProduct(id: number) {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this.loadProducts();
  }

  async toggleProductStatus(id: number, active: boolean) {
    return this.updateProduct(id, { active });
  }

  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = this.supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async deleteImage(imageUrl: string) {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      await this.supabase.storage
        .from('products')
        .remove([fileName]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

}
