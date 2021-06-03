import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeRoutingModule } from './employee-routing.module';
import { TrashComponent } from './trash/trash.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeeCreateComponent } from './employee-create/employee-create.component';
import { MaterialContentModule } from '../material-content.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [

    EmployeeCreateComponent,
    DashboardComponent,
    TrashComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmployeeRoutingModule,
    MaterialContentModule
  ]
})
export class EmployeeModule { }
