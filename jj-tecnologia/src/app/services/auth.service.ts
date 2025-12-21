import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';
import { CartService } from './cart.service';

export interface UserProfile {
  id: string;
  full_name: string;
  role_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  // Agregar este getter
  get client() {
    return this.supabase;
  }

  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);
  userProfile = signal<UserProfile | null>(null);

  constructor( private cartService: CartService) {
    this.supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return sessionStorage.getItem(key);
            }
            return null;
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(key, value);
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(key);
            }
          }
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );

  this.checkSession();
  }

  async checkSession() {
    console.log('Verificando sesión...'); // ← TEMPORAL para debug
  
  const { data } = await this.supabase.auth.getSession();
  
  console.log('Sesión obtenida:', data.session); // ← TEMPORAL para debug
  
  if (data.session) {
    this.isAuthenticated.set(true);
    this.currentUser.set(data.session.user);
    await this.loadUserProfile(data.session.user.id);
    
    console.log('Usuario autenticado:', {
      email: data.session.user.email,
      profile: this.userProfile()
    }); // ← TEMPORAL para debug
  } else {
    console.log('No hay sesión activa'); // ← TEMPORAL para debug
  }
  }

  async loadUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      this.userProfile.set(data);
    }
  }

  async signUp(email: string, password: string, fullName: string) {
   try {
    // 1. Registrar usuario en auth.users
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // 2. Verificar si el trigger creó el usuario en public.users
    if (data.user) {
      console.log('Usuario creado en auth.users:', data.user.id);

      // Esperar un poco para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar si existe en public.users
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error verificando usuario:', checkError);
      }

      // Si NO existe, crearlo manualmente
      if (!existingUser) {
        console.log('Trigger no funcionó, creando usuario manualmente...');
        
        const { error: insertError } = await this.supabase
          .from('users')
          .insert({
            id: data.user.id,
            full_name: fullName,
            role_id: 2,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error creando usuario en public.users:', insertError);
          throw new Error('Error al crear el perfil de usuario');
        }

        console.log('Usuario creado manualmente en public.users');
      } else {
        console.log('Usuario ya existe en public.users (trigger funcionó)');
      }
    }

    return data;
  } catch (error: any) {
    console.error('Error en signUp:', error);
    throw error;
  }
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this.isAuthenticated.set(true);
    this.currentUser.set(data.user);
    await this.loadUserProfile(data.user.id);
    return data;
  }
/**
 * Iniciar sesión con Google OAuth
 */
async signInWithGoogle() {
  try {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;

    console.log('OAuth iniciado:', data);
    return data;
  } catch (error) {
    console.error('Error en signInWithGoogle:', error);
    throw error;
  }
}

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.userProfile.set(null);
    // limpiar carrito al cerrar sesión
  this.cartService.clearCartOnLogout();
  }
}
