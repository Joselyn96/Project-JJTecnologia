import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-service-status-pie-chart',
  imports: [CommonModule],
  templateUrl: './service-status-pie-chart.component.html',
  styleUrl: './service-status-pie-chart.component.css'
})
export class ServiceStatusPieChartComponent implements AfterViewInit, OnDestroy, OnChanges{
  @Input() data: { estado: string; cantidad: number }[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngOnChanges() {
    if (this.chart) {
      this.createChart();
    }
  }

  private createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#fbbf24', // Amarillo (Pendiente)
      '#10b981', // Verde (Aceptado)
      '#ef4444', // Rojo (Rechazado)
      '#3b82f6', // Azul (Completado)
      '#6b7280'  // Gris (Cancelado)
    ];

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.data.map(item => item.estado),
        datasets: [{
          label: 'Cantidad',
          data: this.data.map(item => item.cantidad),
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}
