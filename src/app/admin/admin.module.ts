import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetAllStudentsDataComponent } from './get-all-students-data/get-all-students-data.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [GetAllStudentsDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    HttpClientModule,
    SharedModule,
    NgxPaginationModule,
  ],
})
export class AdminModule {}
