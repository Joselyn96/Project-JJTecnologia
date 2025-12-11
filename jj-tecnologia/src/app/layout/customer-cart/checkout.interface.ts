export interface ShippingAddress {
  shipping_address: string;
  district: string;
  province: string;
  department: string;
  reference?: string;
}

export interface CheckoutData extends ShippingAddress {
  subtotal: number;
  shipping_cost: number;
  total: number;
}

export enum CheckoutStep {
  SUMMARY = 0,
  LOGIN = 1,
  SHIPPING = 2,
  CONFIRMATION = 3,
  PAYMENT = 4,
  SUCCESS = 5
}