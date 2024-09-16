import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetStudentDataComponent } from './get-student-data/get-student-data.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { StudentRoutingModule } from './student-routing.module';
import { EditStudentDataComponent } from './edit-student-data/edit-student-data.component';
import { SharedModule } from '../shared/shared.module';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { AddStudentDataComponent } from './add-student-data/add-student-data.component';

@NgModule({
  declarations: [
    GetStudentDataComponent,
    EditStudentDataComponent,
    AddStudentDataComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StudentRoutingModule,
    HttpClientModule,
    SharedModule,
    NgbDatepickerModule,
  ],
})
export class StudentModule {}
