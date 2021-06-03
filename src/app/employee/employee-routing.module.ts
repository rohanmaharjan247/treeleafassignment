import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeeCreateComponent } from './employee-create/employee-create.component';
import { TrashComponent } from './trash/trash.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create', component: EmployeeCreateComponent },
  { path: 'edit/:id', component: EmployeeCreateComponent },
  { path: 'trash', component: TrashComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeRoutingModule {}
