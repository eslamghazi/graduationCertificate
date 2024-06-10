import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnterIdComponent } from './enter-id/enter-id.component';

const routes: Routes = [
  { path: '', component: EnterIdComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
