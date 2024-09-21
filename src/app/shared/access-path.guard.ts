import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from './swal.service';
import { FireBaseEditUserService } from './fire-base-edit-user.service';

@Injectable({
  providedIn: 'root',
})
export class accessSuperAdminManage implements CanActivate {
  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) { }
  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    this.spinner.show();
    let adminCheck =
      localStorage.getItem('adminCheck')?.split('-')[0] == 'superadmin';
    if (adminCheck) {
      this.spinner.hide();
      return true;
    } else {
      this.router.navigate(['/student/getStudentData']);
      this.spinner.hide();
      this.swal.toastr('error', 'عفوًا ليس لديك صلاحية الدخول لهذه الصفحة');
      return false;
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class AccessGetAllStudentsData implements CanActivate {
  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) { }
  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    this.spinner.show();
    let adminCheck = localStorage.getItem('adminCheck');
    if (adminCheck) {
      this.spinner.hide();
      return true;
    } else {
      this.router.navigate(['/student/getStudentData']);
      this.spinner.hide();
      this.swal.toastr('error', 'عفوًا ليس لديك صلاحية الدخول لهذه الصفحة');
      return false;
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class AccessEditStudentData implements CanActivate {
  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private fireBaseEditService: FireBaseEditUserService
  ) { }
  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    this.spinner.show();

    let id = route.paramMap.get('id');
    let classNumber: any = route.paramMap.get('class');
    let subClassNumber: any = route.paramMap.get('subClass');


    let data = await this.fireBaseEditService.getDataByPathPromise(
      `${classNumber}/${subClassNumber}/${id}`
    );

    if (data) {
      this.spinner.hide();
      return true;
    } else {
      this.router.navigate(['/student/getStudentData']);
      this.spinner.hide();
      this.swal.toastr('error', 'عفوًا هذا الرقم القومي غير مسجل لدينا');
      return false;
    }
  }
}
