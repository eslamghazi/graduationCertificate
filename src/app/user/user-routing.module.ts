import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetUserDataComponent } from './get-user-data/get-user-data.component';
import { EditUserDataComponent } from './edit-user-data/edit-user-data.component';

const routes: Routes = [
  {
    path: '',
    component: GetUserDataComponent,
  },
  {
    path: ':class/:id',
    component: EditUserDataComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
