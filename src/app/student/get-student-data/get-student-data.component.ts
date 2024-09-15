import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseUserService } from 'src/app/shared/fire-base-user.service';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-get-student-data',
  templateUrl: './get-student-data.component.html',
  styleUrls: ['./get-student-data.component.scss'],
})
export class GetStudentDataComponent {
  origin = window.location.origin;

  authArray = [30110281500753];
  notFound = false;
  authFound = false;

  selectClass = new FormControl(0, [Validators.required]);
  NationalId = new FormControl(null, [Validators.required]);

  constructor(
    private fireBaseUserService: FireBaseUserService,
    private route: Router,
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) {}

  userForm = new FormGroup({
    selectClass: this.selectClass,
    NationalId: this.NationalId,
  });

  typingId(event: any) {
    this.notFound = false;
    if (event.value) {
      if (!(event.value.length == 14)) {
        this.NationalId.setErrors({ pattern: true });
      }
    }
  }

  async searchFile() {
    this.spinner.show();

    if (this.authArray.includes(this.NationalId.value as any)) {
      this.authFound = true;
      localStorage.setItem('adminCheck', this.NationalId.value as any);
      this.spinner.hide();
      this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
      return;
    }

    const folderPath =
      this.selectClass.value == 1 ? 'Class2024Intership' : 'NotYet';

    this.fireBaseUserService
      .getDataByPath(`${folderPath}/September/${this.NationalId.value}`)
      .subscribe(async (downloadUrl) => {
        if (downloadUrl) {
          this.notFound = false;
          this.route.navigateByUrl(
            `/student/editStudentData/${this.selectClass.value}/${this.NationalId.value}`
          );
          this.spinner.hide();
        } else {
          this.fireBaseUserService
            .getDataByPath(`${folderPath}/June/${this.NationalId.value}`)
            .subscribe((downloadUrl) => {
              if (downloadUrl) {
                this.notFound = false;
                this.route.navigateByUrl(
                  `/student/editStudentData/${this.selectClass.value}/${this.NationalId.value}`
                );
                this.spinner.hide();
              } else {
                this.notFound = true;
                this.spinner.hide();
              }
            });
        }
      });
  }
}
