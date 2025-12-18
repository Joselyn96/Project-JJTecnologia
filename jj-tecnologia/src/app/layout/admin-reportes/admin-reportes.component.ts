import { Component, OnInit, signal  } from '@angular/core';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesLineChartComponent } from '../../shared/components/sales-line-chart/sales-line-chart.component';
import { ReportsService } from '../../services/reports.service';

import { CategoryBarChartComponent } from '../../shared/components/category-bar-chart/category-bar-chart.component';
import { ServiceStatusPieChartComponent } from '../../shared/components/service-status-pie-chart/service-status-pie-chart.component';
import { ServiceTypeBarChartComponent } from '../../shared/components/service-type-bar-chart/service-type-bar-chart.component';
import { ClientsLineChartComponent } from '../../shared/components/clients-line-chart/clients-line-chart.component';

@Component({
  selector: 'app-admin-reportes',
  imports: [CommonModule, FormsModule, CategoryBarChartComponent, ServiceStatusPieChartComponent, ServiceTypeBarChartComponent, ClientsLineChartComponent],
  templateUrl: './admin-reportes.component.html',
  styleUrl: './admin-reportes.component.css'
})
export class AdminReportesComponent implements OnInit{
  private reportsService = inject(ReportsService);

  // Control de tabs
  activeTab = signal<'ventas' | 'servicios' | 'clientes'>('ventas');

  // Filtros de fecha
  fechaDesde = signal<string>('');
  fechaHasta = signal<string>('');

  // Loading
  isLoading = signal(false);

  // ========== DATOS TAB 1: VENTAS ==========
  ventasPorCategoria = signal<{ categoria: string; cantidad: number; valor: number }[]>([]);

  // ========== DATOS TAB 2: SERVICIOS ==========
  serviciosPorEstado = signal<{ estado: string; cantidad: number; porcentaje: number }[]>([]);
  serviciosPorTipo = signal<{ tipo: string; cantidad: number }[]>([]);
  tasaAceptacion = signal<number>(0);
  tasaRechazo = signal<number>(0);
  totalServicios = signal<number>(0);

  // ========== DATOS TAB 3: CLIENTES ==========
  clientesPorMes = signal<{ mes: string; cantidad: number }[]>([]);
  totalClientesAtendidos = signal<number>(0);
  topClientesPorCompras = signal<{ nombre: string; compras: number; monto: number }[]>([]);
  topClientesPorServicios = signal<{ nombre: string; servicios: number }[]>([]);

  ngOnInit() {
    this.setDefaultDates();
    this.loadAllData();
  }

  // Establecer fechas por defecto (último mes)
  setDefaultDates() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    this.fechaHasta.set(hoy.toISOString().split('T')[0]);
    this.fechaDesde.set(hace30Dias.toISOString().split('T')[0]);
  }

  // Cambiar tab activo
  setActiveTab(tab: 'ventas' | 'servicios' | 'clientes') {
    this.activeTab.set(tab);
  }

  // Aplicar filtros y recargar datos
  async applyFilters() {
    if (!this.fechaDesde() || !this.fechaHasta()) {
      alert('Por favor selecciona ambas fechas');
      return;
    }

    if (new Date(this.fechaDesde()) > new Date(this.fechaHasta())) {
      alert('La fecha "Desde" no puede ser mayor a "Hasta"');
      return;
    }

    await this.loadAllData();
  }

  // Cargar todos los datos
  async loadAllData() {
    this.isLoading.set(true);

    await Promise.all([
      this.loadVentasData(),
      this.loadServiciosData(),
      this.loadClientesData()
    ]);

    this.isLoading.set(false);
  }

  // ========== CARGAR DATOS DE VENTAS ==========
  async loadVentasData() {
    const data = await this.reportsService.getVentasPorCategoria(
      this.fechaDesde(),
      this.fechaHasta()
    );
    this.ventasPorCategoria.set(data);
  }

  // ========== CARGAR DATOS DE SERVICIOS ==========
  async loadServiciosData() {
    const [estados, tipos, tasas] = await Promise.all([
      this.reportsService.getServiciosPorEstado(this.fechaDesde(), this.fechaHasta()),
      this.reportsService.getServiciosPorTipo(this.fechaDesde(), this.fechaHasta()),
      this.reportsService.getTasasServicios(this.fechaDesde(), this.fechaHasta())
    ]);

    this.serviciosPorEstado.set(estados);
    this.serviciosPorTipo.set(tipos);
    this.totalServicios.set(tasas.total);
    this.tasaAceptacion.set(tasas.tasaAceptacion);
    this.tasaRechazo.set(tasas.tasaRechazo);
  }

  // ========== CARGAR DATOS DE CLIENTES ==========
  async loadClientesData() {
    const [porMes, total, topCompras, topServicios] = await Promise.all([
      this.reportsService.getClientesPorMes(this.fechaDesde(), this.fechaHasta()),
      this.reportsService.getTotalClientesAtendidos(this.fechaDesde(), this.fechaHasta()),
      this.reportsService.getTopClientesPorCompras(this.fechaDesde(), this.fechaHasta()),
      this.reportsService.getTopClientesPorServicios(this.fechaDesde(), this.fechaHasta())
    ]);

    this.clientesPorMes.set(porMes);
    this.totalClientesAtendidos.set(total);
    this.topClientesPorCompras.set(topCompras);
    this.topClientesPorServicios.set(topServicios);
  }

  // ========== EXPORTAR CSV ==========
  exportCSV() {
    const tab = this.activeTab();

    if (tab === 'ventas') {
      this.exportVentasCSV();
    } else if (tab === 'servicios') {
      this.exportServiciosCSV();
    } else if (tab === 'clientes') {
      this.exportClientesCSV();
    }
  }

  exportVentasCSV() {
    const headers = ['Categoría', 'Cantidad', 'Valor Total'];
    const rows = this.ventasPorCategoria().map(v => 
      [v.categoria, v.cantidad.toString(), `S/ ${v.valor.toFixed(2)}`]
    );

    this.downloadCSV([headers, ...rows], `reporte_ventas_${this.fechaDesde()}_${this.fechaHasta()}.csv`);
  }

  exportServiciosCSV() {
    const headers = ['Estado', 'Cantidad', 'Porcentaje'];
    const rows = this.serviciosPorEstado().map(s => 
      [s.estado, s.cantidad.toString(), `${s.porcentaje.toFixed(1)}%`]
    );

    this.downloadCSV([headers, ...rows], `reporte_servicios_${this.fechaDesde()}_${this.fechaHasta()}.csv`);
  }

  exportClientesCSV() {
    const headers = ['Cliente', 'Total Servicios'];
    const rows = this.topClientesPorServicios().map(c => 
      [c.nombre, c.servicios.toString()]
    );

    this.downloadCSV([headers, ...rows], `reporte_clientes_${this.fechaDesde()}_${this.fechaHasta()}.csv`);
  }

  downloadCSV(data: string[][], filename: string) {
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Utilidades
  formatCurrency(value: number): string {
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
