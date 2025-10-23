import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import localeEsPe from '@angular/common/locales/es-PE';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';


registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), { provide: LOCALE_ID, useValue: 'es-PE' }]
};
