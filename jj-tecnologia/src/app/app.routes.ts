import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ProductsComponent } from './features/products/products.component';
import { ServicesComponent } from './features/services/services.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './layout/admin-dashboard/admin-dashboard.component';
import { adminGuard } from './core/guards/admin.guard';
import { AdminProductsComponent } from './layout/admin-products/admin-products.component';
import { AdminServicesComponent } from './layout/admin-services/admin-services.component';
import { CustomerCartComponent } from './layout/customer-cart/customer-cart.component';
import { AuthCallbackComponent } from './features/auth-callback/auth-callback.component';
import { MyOrdersComponent } from './features/my-orders/my-orders.component';
import { AdminOrderComponent } from './layout/admin-order/admin-order.component';
import { AdminCustomerComponent } from './layout/admin-customer/admin-customer.component';
import { MyServicesComponent } from './features/my-services/my-services.component';
import { AdminSolicitudesComponent } from './layout/admin-solicitudes/admin-solicitudes.component';
import { AdminReportesComponent } from './layout/admin-reportes/admin-reportes.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'products', component: ProductsComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'customer-cart', component: CustomerCartComponent },
  { path: 'my-orders', component: MyOrdersComponent },
  { path: 'my-services', component: MyServicesComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: 'admin', 
    component: AdminLayoutComponent, 
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'productos', component: AdminProductsComponent },
      { path: 'servicios', component: AdminServicesComponent },
      { path: 'solicitudes', component: AdminSolicitudesComponent },
      { path: 'reportes', component: AdminReportesComponent },
      { path: 'ordenes', component: AdminOrderComponent },
      { path: 'clientes', component: AdminCustomerComponent },
    ] },
];
