import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupabaseUserService } from './../../shared/supabase-user.service';
import { SwalService } from 'src/app/shared/swal.service';
import { environment } from 'src/environments/environment';

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
    private supabaseUserService: SupabaseUserService,
    private route: Router,
    private spinner: NgxSpinnerService,
    private swal: SwalService
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

  getClass() {
    const nationalId = this.NationalId.value;
    this.supabaseUserService
    .getDataByPath('auth')
    .subscribe((data) => {
      if (data) {
        const myAuth = data.find((x: any) => +x.id === nationalId);
        const authClass = myAuth.class_id;

        this.supabaseUserService
        .getDataByPath('classes')
        .subscribe((classData) => {
          if (classData.find((x: any) => x.id === authClass)) {
              localStorage.setItem('currentClass', authClass);
            } else {
              this.supabaseUserService
        .getDataByPath('settings')
        .subscribe((settingsData) => {
          if (settingsData) {
            localStorage.setItem('currentClass', settingsData.find((x: any) => x.id === 'default_class').value);
          }
        });

            }
        });

      }
    });
  }

  async searchFile() {
    this.spinner.show();

    // Check for admin
    if (this.NationalId.value === environment.authorize) {
      this.authFound = true;
      localStorage.setItem('adminCheck', `superadmin-${environment.authorize}`);
      this.getClass();
      this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
      this.spinner.hide();
      return;
    }

    // Check auth table first
    this.supabaseUserService
      .getDataByPath('auth', this.NationalId.value!)
      .subscribe((res) => {
        if (res?.auth_level) {
          this.authFound = true;
          localStorage.setItem(
            'adminCheck',
            `${res.auth_level}-${this.NationalId.value}`
          );
          this.getClass();
          this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
          this.spinner.hide();
          return;
        }

        // Check students table
        this.supabaseUserService
          .getDataByPath('students', this.NationalId.value!)
          .subscribe((student) => {
            if (student &&
                student.class_id === this.selectClass.value
                // && student.subclass_id === this.selectSubClass.value
              ) {
              this.notFound = false;
              this.route.navigateByUrl(
                `/student/editStudentData/${student.class_id}/${student.subclass_id}/${student.id}`
              );
              this.spinner.hide();
            } else {
              // check if allow_anonymous is true
              const currentClass = this.Classes.find(x => x.key === this.selectClass.value)?.value;
              if (currentClass?.allow_anonymous) {
                this.route.navigate(['/student/addStudentData', this.selectClass.value], { queryParams: { nationalId: this.NationalId.value } });
                this.spinner.hide();
              } else {
                this.notFound = true;
                this.spinner.hide();
              }
            }
          });
      });
  }

  getClasses() {
    this.spinner.show();
    this.supabaseUserService
      .getDataByPath('classes')
      .subscribe((data) => {
        this.Classes = data.map((item: any) => ({
          key: item.id,
          value: { Id: item.id, Name: item.name, allow_anonymous: item.allow_anonymous }
        }));
        this.spinner.hide();
      });
  }

  getSubClasses(classId: string) {
    this.spinner.show();
    this.supabaseUserService
      .getDataByPath('subclasses')
      .subscribe((data) => {
        this.SubClasses = data
          .filter((sub: any) => sub.class_id === classId)
          .map((item: any) => ({
            key: item.id,
            value: { Id: item.id, Name: item.name }
          }));
        this.spinner.hide();
      });
  }

  changeClass() {
    if (this.selectClass.value === "0") {
      this.SubClasses = [];
      return;
    }
    this.getSubClasses(this.selectClass.value!);
  }
}
