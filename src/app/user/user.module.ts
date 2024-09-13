import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetUserDataComponent } from './get-user-data/get-user-data.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserRoutingModule } from './user-routing.module';
import { EditUserDataComponent } from './edit-user-data/edit-user-data.component';
import { SharedModule } from '../shared/shared.module';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [GetUserDataComponent, EditUserDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UserRoutingModule,
    HttpClientModule,
    SharedModule,
    NgbDatepickerModule,
  ],
})
export class UserModule {}
