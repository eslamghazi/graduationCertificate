import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewEditComponent } from './components/view-edit/view-edit.component';
import { EnterIdComponent } from './components/enter-id/enter-id.component';

const routes: Routes = [
  { path: '', component: EnterIdComponent, pathMatch: 'full' },
  { path: 'viewEdit', component: ViewEditComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
