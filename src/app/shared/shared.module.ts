import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderInterceptor } from './loader.interceptor';
import { NgxPaginationModule } from 'ngx-pagination';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import {
  AccessEditStudentData,
  AccessGetAllStudentsData,
  accessSuperAdminManage,
} from './access-path.guard';
import { SharedModalComponent } from './shared-modal/shared-modal.component';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [NavBarComponent, FooterComponent, SharedModalComponent],
  imports: [CommonModule, NgxPaginationModule, RouterModule, FormsModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true,
    },
    accessSuperAdminManage,
    AccessGetAllStudentsData,
    AccessEditStudentData,
    NgbActiveModal,
    NgbNavModule,
  ],
  exports: [NavBarComponent, FooterComponent, SharedModalComponent],
})
export class SharedModule {}
