import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupabaseUserService } from './../../shared/supabase-user.service';
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

  async searchFile() {
    this.spinner.show();

    // Check for admin
    if (this.NationalId.value === '30110281500753') {
      this.authFound = true;
      localStorage.setItem('adminCheck', `superadmin-30110281500753`);
      this.spinner.hide();
      this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
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
          this.spinner.hide();
          this.swal.toastr('success', 'اهلاً بك، تم تفعيل صلاحيات الادمن');
          return;
        }

        // Check students table
        this.supabaseUserService
          .getDataByPath('students', this.NationalId.value!)
          .subscribe((student) => {
            if (student &&
                student.class_id === this.selectClass.value &&
                student.subclass_id === this.selectSubClass.value) {
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
    this.supabaseUserService
      .getDataByPath('classes')
      .subscribe((data) => {
        this.Classes = data.map((item: any) => ({
          key: item.id,
          value: { Id: item.id, Name: item.name }
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
