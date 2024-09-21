import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetAllStudentsDataComponent } from './get-all-students-data/get-all-students-data.component';
import { SuperAdminManageComponent } from './super-admin-manage/super-admin-manage.component';
import {
  AccessGetAllStudentsData,
  accessSuperAdminManage,
} from '../shared/access-path.guard';
import { SettingsComponent } from '../settings/settings/settings.component';

const routes: Routes = [
  {
    path: 'admin/getAllStudentsData',
    component: GetAllStudentsDataComponent,
    canActivate: [AccessGetAllStudentsData],
  },
  {
    path: 'admin/superAdminManage',
    component: SuperAdminManageComponent,
    canActivate: [accessSuperAdminManage],
  },
  {
    path: 'admin/settings',
    component: SettingsComponent,
    canActivate: [AccessGetAllStudentsData],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
