export interface TimeSlot {
  id: number;
  day_of_week: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  start_time: string;  // "09:00:00"
  end_time: string;    // "10:00:00"
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AvailableTimeOption {
  value: string;       // "09:00"
  label: string;       // "09:00 - 10:00"
  isAvailable: boolean;
}