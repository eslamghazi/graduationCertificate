import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetAllStudentsDataComponent } from './get-all-students-data/get-all-students-data.component';

const routes: Routes = [
  {
    path:'',
    component:GetAllStudentsDataComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
