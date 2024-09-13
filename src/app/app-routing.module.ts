import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GetUserDataComponent } from './user/get-user-data/get-user-data.component';

const routes: Routes = [
  {path:'', redirectTo:"/getUserData", pathMatch:'full'},

  {path:'getUserData',
  loadChildren: () => import(`./user/user.module`).then(m => m.UserModule)
  },

  {path:'getAllStudentsData',
  loadChildren: () => import(`./admin/admin.module`).then(m => m.AdminModule)
  },

  { path: '**', pathMatch: 'full',
  component: GetUserDataComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
