import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetStudentDataComponent } from './get-student-data/get-student-data.component';
import { EditStudentDataComponent } from './edit-student-data/edit-student-data.component';
import {
  AccessEditStudentData,
  AccessGetAllStudentsData,
} from '../shared/access-path.guard';
import { AddStudentDataComponent } from './add-student-data/add-student-data.component';

const routes: Routes = [
  {
    path: 'student/getStudentData',
    component: GetStudentDataComponent,
  },
  {
    path: 'student/addStudentData/:class',
    component: AddStudentDataComponent,
    canActivate: [AccessGetAllStudentsData],
  },
  {
    path: 'student/editStudentData/:class/:id',
    component: EditStudentDataComponent,
    canActivate: [AccessEditStudentData],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentRoutingModule {}
