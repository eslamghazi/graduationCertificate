import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetAllStudentsDataComponent } from './get-all-students-data/get-all-students-data.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SuperAdminManageComponent } from './super-admin-manage/super-admin-manage.component';
import {
  NgbActiveModal,
  NgbModule,
  NgbNavModule,
} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [GetAllStudentsDataComponent, SuperAdminManageComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    HttpClientModule,
    SharedModule,
    NgxPaginationModule,
    NgbNavModule,
  ],
  providers: [],
})
export class AdminModule {}
