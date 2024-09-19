import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetAllStudentsDataComponent } from './get-all-students-data/get-all-students-data.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SuperAdminManageComponent } from './super-admin-manage/super-admin-manage.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SearchStudentComponent } from './search-student/search-student.component';
import { InvalidImagesComponent } from './invalid-images/invalid-images.component';
import { AdminManageComponent } from './auth/admin-manage/admin-manage.component';
import { AddEditAdminComponent } from './auth/add-edit-admin/add-edit-admin.component';
import { UploadExcelComponent } from './upload-excel/upload-excel.component';

@NgModule({
  declarations: [
    GetAllStudentsDataComponent,
    SuperAdminManageComponent,
    SearchStudentComponent,
    InvalidImagesComponent,
    AdminManageComponent,
    AddEditAdminComponent,
    UploadExcelComponent,
  ],
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
