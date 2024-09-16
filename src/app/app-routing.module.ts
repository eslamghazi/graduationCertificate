import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/student/getStudentData', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () =>
      import(`./student/student.module`).then((m) => m.StudentModule),
  },
  {
    path: '',
    loadChildren: () =>
      import(`./admin/admin.module`).then((m) => m.AdminModule),
  },
  {
    path: '**',
    redirectTo: '/student/getStudentData',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
