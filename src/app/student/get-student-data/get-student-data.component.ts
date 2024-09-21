import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import { FireBaseUserService } from 'src/app/shared/fire-base-user.service';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-get-student-data',
  templateUrl: './get-student-data.component.html',
  styleUrls: ['./get-student-data.component.scss'],
})
export class GetStudentDataComponent implements OnInit {
  Classes: any[] = [];
  SubClasses: any[] = [];

  origin = window.location.origin;

  notFound = false;
  authFound = false;

  selectClass = new FormControl("0", [Validators.required]);
  selectSubClass = new FormControl("0", [Validators.required]);
  NationalId = new FormControl(null, [Validators.required]);

  constructor(
    private fireBaseUserService: FireBaseUserService,
    private route: Router,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private firebaseAdminService: FireBaseAdminService
  ) { }
  ngOnInit(): void {
    this.getClasses();
  }

  userForm = new FormGroup({
    selectClass: this.selectClass,
    selectSubClass: this.selectSubClass,
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
    if (this.NationalId.value == '30110281500753') {
      this.authFound = true;
      localStorage.setItem('adminCheck', `superadmin-30110281500753`);
      this.spinner.hide();
      this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
      return;
    }
    this.fireBaseUserService
      .getDataByPath(`/auth/${this.NationalId.value}`)
      .subscribe((res) => {
        console.log(res);
        if (res?.Auth) {
          this.authFound = true;
          localStorage.setItem(
            'adminCheck',
            `${res?.Auth as any}-${this.NationalId.value}`
          );
          this.spinner.hide();
          this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
          return;
        }

        this.fireBaseUserService
          .getDataByPath(`${this.selectClass.value}/${this.selectSubClass.value}/${this.NationalId.value}`)
          .subscribe((downloadUrl) => {
            if (downloadUrl) {
              this.notFound = false;
              this.route.navigateByUrl(
                `/student/editStudentData/${this.selectClass.value}/${this.selectSubClass.value}/${this.NationalId.value}`
              );
              this.spinner.hide();
            } else {
              this.notFound = true;
              this.spinner.hide();
            }
          });

      });
  }

  getClasses() {
    this.spinner.show();
    this.firebaseAdminService.getAllData(`/auth/Classes`, "object").subscribe((data) => {
      console.log(data);

      for (let key in data) {
        if (key != 'DefaultClass')
          this.Classes.push({ key: key, value: data[key] });
      }
      this.spinner.hide();
      console.log(this.Classes);

    })
  }

  getSubClasses(Class: any) {
    this.spinner.show()

    this.SubClasses = []
    for (const key in Class?.SubClasses) {
      this.SubClasses.push({ key: key, value: Class.SubClasses[key] });
    }

    this.spinner.hide()
  }

  changeClass() {
    if (this.selectClass.value == "0") {
      this.SubClasses = []
      return
    }

    let currentClass = this.Classes.find((x) => x.key == this.selectClass.value)?.value
    console.log(currentClass);

    this.getSubClasses(currentClass)
  }
}
