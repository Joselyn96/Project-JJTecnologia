export interface Service {
  id: number;
  name: string;
  description: string;
  base_price: number;
  active: boolean;
  created_at?: string;
}