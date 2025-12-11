import { AfterViewInit, Component, ElementRef, Input, ViewChild, effect, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import Chart from 'chart.js/auto';
import { DashboardService } from '../../../services/dashboard.service';


type Period = 'day' | 'week' | 'month';
@Component({
  selector: 'app-sales-line-chart',
  imports: [ NgClass ],
  templateUrl: './sales-line-chart.component.html',
  styleUrl: './sales-line-chart.component.css'
})
export class SalesLineChartComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  selectedPeriod: Period = 'day';
  chart?: Chart;
  isLoading = true;

  constructor(private dashboardService: DashboardService) {}

  async ngAfterViewInit() {
    // Pequeño delay para asegurar que el canvas esté listo
    setTimeout(async () => {
      await this.createChart();
    }, 100);
  }

  async createChart() {
    const ctx = this.canvasRef?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.error('❌ No se pudo obtener el contexto del canvas');
      return;
    }

    try {
      this.isLoading = true;
      const result = await this.dashboardService.getRevenueByPeriod(this.selectedPeriod);
      console.log('📊 Creando gráfico con datos:', result);

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: result.labels,
          datasets: [
            {
              label: 'Ventas (S/)',
              data: result.data,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              fill: true
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              position: 'top',
              labels: {
                font: { size: 12 },
                padding: 10,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 13 },
              bodyFont: { size: 12 },
              displayColors: false,
              callbacks: {
                label: (context) => {
    const value = context.parsed.y ?? 0;
    return `S/ ${value.toFixed(2)}`;
  }
              }
            }
          },
          scales: {
            x: { 
              grid: { display: false },
              ticks: { font: { size: 11 } }
            },
            y: { 
              beginAtZero: true,
  grid: { 
    color: 'rgba(0, 0, 0, 0.05)'
  },
  border: {
    display: false  // ✅ Usa esto en vez de drawBorder
  },
  ticks: { 
    font: { size: 11 },
    callback: (value) => `S/ ${value}`
  }
            },
          },
        },
      });
    } catch (error) {
      console.error('❌ Error creando gráfico:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async changePeriod(period: Period) {
    if (this.isLoading) return;

    console.log('🔄 Cambiando periodo a:', period);
    this.selectedPeriod = period;
    
    if (!this.chart) {
      console.error('❌ El gráfico no existe');
      return;
    }

    try {
      this.isLoading = true;
      const result = await this.dashboardService.getRevenueByPeriod(period);
      console.log('📊 Nuevos datos:', result);
      
      this.chart.data.labels = result.labels;
      this.chart.data.datasets[0].data = result.data;
      this.chart.update('active');
    } catch (error) {
      console.error('❌ Error actualizando gráfico:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
