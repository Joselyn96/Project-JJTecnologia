/**
 * Utilidad para generar números de orden con formato profesional
 */

/**
 * Genera un número de orden con formato ORD-YYYY-XXXX
 * 
 * @param orderId - ID de la orden de la base de datos (número autoincremental)
 * @param createdAt - Fecha de creación de la orden en formato ISO string
 * @returns Número de orden formateado (ejemplo: "ORD-2025-0012")
 * 
 * @example
 * generateOrderNumber(1, "2025-12-11T10:30:00") → "ORD-2025-0001"
 * generateOrderNumber(12, "2025-12-11T10:30:00") → "ORD-2025-0012"
 * generateOrderNumber(999, "2025-12-11T10:30:00") → "ORD-2025-0999"
 * generateOrderNumber(10000, "2026-01-01T10:30:00") → "ORD-2026-10000"
 */
export function generateOrderNumber(orderId: number, createdAt: string): string {
  // Extraer el año de la fecha de creación
  const date = new Date(createdAt);
  const year = date.getFullYear();
  
  // Convertir el ID a string con padding de 4 dígitos
  // Ejemplos:
  // 1 → "0001"
  // 12 → "0012"
  // 999 → "0999"
  // 10000 → "10000" (si supera 4 dígitos, se mantiene completo)
  const paddedId = orderId.toString().padStart(4, '0');
  
  // Retornar formato final: ORD-YYYY-XXXX
  return `ORD-${year}-${paddedId}`;
}