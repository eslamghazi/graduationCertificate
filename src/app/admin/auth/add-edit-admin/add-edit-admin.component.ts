import { SettingsService } from './../../../shared/settings.service';
import { FireBaseAuthService } from 'src/app/shared/fire-base-auth.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SwalService } from 'src/app/shared/swal.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';

@Component({
  selector: 'app-add-edit-admin',
  templateUrl: './add-edit-admin.component.html',
  styleUrls: ['./add-edit-admin.component.scss'],
})
export class AddEditAdminComponent implements OnInit {
  @Input() header: string = '';
  @Input() data: any;
  classes: any[] = []

  Name = new FormControl(null, [Validators.required]);
  NationalId = new FormControl(null, [Validators.required]);
  Auth = new FormControl(0, [Validators.required]);
  class = new FormControl(null, [Validators.required]);

  constructor(
    public activeModal: NgbActiveModal,
    private firebaseAuthService: FireBaseAuthService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal,
    private settingsService: SettingsService
  ) { }

  editForm = new FormGroup({
    Name: this.Name,
    NationalId: this.NationalId,
    Auth: this.Auth,
    class: this.class,
  });

  ngOnInit(): void {
    if (this.data) {
      this.editForm.patchValue({
        Name: this.data.Name,
        NationalId: this.data.NationalId,
        Auth:
          this.data.Auth.toString().toLowerCase() == 'admin'
            ? 1
            : this.data.Auth.toString().toLowerCase() == 'sudoadmin'
              ? 2
              : (3 as any),
        class: this.data.Class,
      });
    }
    this.getClassesData()

  }

  confirm() {
    const path = `/auth/${this.NationalId.value}`;
    let data = {
      Name: this.Name.value,
      NationalId: this.NationalId.value,
      Auth:
        this.Auth.value == 1
          ? 'admin'
          : this.Auth.value == 2
            ? 'sudoadmin'
            : 'superadmin',
      Class: this.class.value,
    };

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من فتح الصورة في تبويب اخر ؟';

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تعديل بيانات الأدمن ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.firebaseAuthService
          .addEditDataToObject(path, data)
          .then(() => {
            this.spinner.hide();
            this.swal.toastr(
              'success',
              this.data ? 'تم تعديل الأدمن بنجاح' : 'تمت اضافة الأدمن بنجاح'
            );
            this.activeModal.close();
          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr(
              'success',
              this.data
                ? 'حدث خطأ اثناء عملية تعديل الأدمن'
                : 'حدث خطأ اثناء عملية اضافة الأدمن'
            );
            this.activeModal.close();
            console.log(error);
          });
      }
    });
  }

  typingId(event: any) {

    if (event.value) {
      if (!(event.value.length == 14)) {
        this.NationalId.setErrors({ pattern: true });
      }
    }
  }



  getClassesData() {
    this.spinner.show()
    this.classes = []
    this.settingsService.getDataByPath("auth/Classes").subscribe((data) => {
      for (const key in data) {

        if (key != "DefaultClass") {
          this.classes.push({ key: key, value: data[key] });
        }
      }
      this.spinner.hide()
    })
  }

}
