declare module 'ubigeo-peru' {
  export interface UbigeoItem {
    departamento: string;
    provincia: string;
    distrito: string;
    nombre: string;
  }

  export const reniec: UbigeoItem[];
}