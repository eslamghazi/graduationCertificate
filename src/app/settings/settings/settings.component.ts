import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAuthService } from 'src/app/shared/fire-base-auth.service';
import { SettingsService } from 'src/app/shared/settings.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';
import { AddEditSettingsComponent } from '../add-edit-settings/add-edit-settings.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  currentClass = localStorage.getItem("defaultClass")
  comingSoonStatus = false;

  allClassesData: any

  classes: any[] = []
  subClasses: any[] = []
  options: any[] = []


  class = new FormControl("0");
  subClass = new FormControl("0");
  option = new FormControl("0");
  defaultClass = new FormControl("0");

  constructor(private settingsService: SettingsService, private firebaseAuthService: FireBaseAuthService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getComingSoonStatus()
    this.getSettingsData()
  }

  settingsForm = new FormGroup({
    class: this.class,
    subClass: this.subClass,
    option: this.option,
    defaultClass: this.defaultClass,
  });

  getSettingsData() {
    this.spinner.show()
    this.classes = []
    this.defaultClass.patchValue("0")
    this.settingsService.getDataByPath("auth/Classes").subscribe((data) => {
      this.allClassesData = data
      for (const key in data) {
        if (key != "DefaultClass") {
          this.classes.push({ key: key, value: data[key] });
          if (key == this.currentClass) {
          }
        } else {
          this.defaultClass.patchValue(data[key] ?? "0")
          console.log(this.defaultClass.value);

        }
      }
      console.log(!this.allClassesData[this.currentClass as any]);

      if (!this.allClassesData[this.currentClass as any]) localStorage.removeItem("defaultClass")
      if (!this.allClassesData[this.defaultClass.value as any]) this.defaultClass.patchValue("0")
      console.log(this.classes);


      this.getSubClasses(data[this.currentClass as any ?? this.classes[0]?.key])
      this.getOptions(data[this.currentClass as any ?? this.classes[0]?.key])
      this.spinner.hide()
    })
  }

  getSubClasses(Class: any) {
    this.spinner.show()

    this.subClasses = []
    for (const key in Class?.SubClasses) {
      this.subClasses.push({ key: key, value: Class.SubClasses[key] });
    }

    this.spinner.hide()
  }

  getOptions(Class: any) {
    this.spinner.show()
    this.options = []
    for (const key in Class?.Options) {
      this.options.push({ key: key, value: Class.Options[key] });
    }

    this.spinner.hide()
  }


  getComingSoonStatus() {
    this.spinner.show();
    this.firebaseAuthService.getDataByPath('/auth/comingSoon').subscribe((result: any) => {
      this.comingSoonStatus = result
      this.spinner.hide();
    });
  }


  changeComingSoon() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = this.comingSoonStatus
      ? 'هل انت متأكد من ايقاف واجهة Coming Soon ؟'
      : 'هل انت متأكد من تفعيل واجهة Coming Soon ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        if (this.comingSoonStatus) {
          this.firebaseAuthService.insertIntoDb('auth/comingSoon', false);
          window.location.reload();
        } else {
          this.firebaseAuthService.insertIntoDb('auth/comingSoon', true);
          window.location.reload();
        }
      }
    });
  }


  add(target: string) {
    const modalRef = this.modalService.open(AddEditSettingsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.header = "اضافة بيانات جديدة";
    modalRef.componentInstance.footer = "اضافة";

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        if (target == "addClass") {
          this.spinner.show();

          const defaultSubClass = {
            June: { Id: "June", Name: "يونيو" }, September: { Id: "September", Name: "سبتمبر" }
          }
          const defaultOptions = {
            NotUpload: { Id: "NotUpload", Name: "الطلاب الذين لم يقوموا برفع صورهم" }, UploadedImages: { Id: "UploadedImages", Name: "الطلاب الذين قاموا برفعوا صورهم" }
          }

          let newClasses: any = {};

          newClasses = { ...this.allClassesData, [result.Id]: { ...result, SubClasses: { ...defaultSubClass }, Options: { ...defaultOptions } } };
          console.log(newClasses);
          this.firebaseAuthService.insertIntoDb('auth/Classes', newClasses)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم اضافة البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء اضافة البيانات');
              console.log(error);
            })

        } else if (target == "addSubClass") {
          this.spinner.show();
          let currentClass = this.classes.find((x) => x.key == this.class.value)?.value
          currentClass.SubClasses = { ...currentClass.SubClasses, [result.Id]: result }

          this.firebaseAuthService.insertIntoDb(`auth/Classes/${currentClass.Id}`, currentClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم اضافة البيانات بنجاح');
              this.getSettingsData()

            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء اضافة البيانات');
              console.log(error);
            })

        } else if (target == "addOption") {
          this.spinner.show();
          let currentClass = this.classes.find((x) => x.key == this.class.value)?.value
          currentClass.Options = { ...currentClass.Options, [result.Id]: result }

          this.firebaseAuthService.insertIntoDb(`auth/Classes/${currentClass.Id}`, currentClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم اضافة البيانات بنجاح');
              this.getSettingsData()
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء اضافة البيانات');
              console.log(error);
            })

        }
      }
    });
  }

  edit(target: string) {
    if (
      (target == "editClass" &&
        this.class.value == "0")
      ||
      (target == "editSubClass" &&
        this.subClass.value == "0")
      ||
      (target == "editOption" &&
        this.option.value == "0")
    ) {
      return;
    }

    const modalRef = this.modalService.open(AddEditSettingsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.header = "تعديل البيانات";
    modalRef.componentInstance.footer = "تعديل";
    modalRef.componentInstance.data = target == "editClass"
      ? this.classes.find((x) => x.key == this.class.value)?.value
      : target == "editSubClass" ? this.subClasses.find((x) => x.key == this.subClass.value)?.value
        : this.options.find((x) => x.key == this.option.value)?.value

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        if (target == "editClass") {
          this.spinner.show();
          let currentSubClasses = { ...this.allClassesData[this.class.value as any].SubClasses };
          let currentOptions = { ...this.allClassesData[this.class.value as any].Options };

          let newClasses: any = { ...this.allClassesData };

          delete newClasses[`${this.class.value as any}`]

          newClasses = { ...newClasses, [result.Id]: { ...result, SubClasses: { ...currentSubClasses }, Options: { ...currentOptions } } };

          this.firebaseAuthService.insertIntoDb('auth/Classes', newClasses)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم تعديل البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء تعديل البيانات');
              console.log(error);
            })

        } else if (target == "editSubClass") {
          this.spinner.show();
          let currentClass = this.classes.find((x) => x.key == this.class.value)?.value

          delete currentClass.SubClasses[this.subClass.value as any]

          currentClass.SubClasses = { ...currentClass.SubClasses, [result.Id]: result }

          this.firebaseAuthService.insertIntoDb(`auth/Classes/${currentClass.Id}`, currentClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم تعديل البيانات بنجاح');
              this.getSettingsData()

            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء تعديل البيانات');
              console.log(error);
            })

        } else if (target == "editOption") {
          this.spinner.show();
          let currentClass = this.classes.find((x) => x.key == this.class.value)?.value

          delete currentClass.Options[this.option.value as any]

          currentClass.Options = { ...currentClass.Options, [result.Id]: result }

          this.firebaseAuthService.insertIntoDb(`auth/Classes/${currentClass.Id}`, currentClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم تعديل البيانات بنجاح');
              this.getSettingsData()
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء تعديل البيانات');
              console.log(error);
            })

        }
      }
    });
  }
  delete(target: string) {
    if (
      (target == "deleteClass" &&
        this.class.value == "0")
      ||
      (target == "deleteSubClass" &&
        this.subClass.value == "0")
      ||
      (target == "deleteOption" &&
        this.option.value == "0")
    ) {
      return;
    }
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = "هل انت متأكد من حذف البيانات ؟";

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        if (target == "deleteClass") {
          this.spinner.show();
          this.firebaseAuthService.removeImagePropertyFromDatabase(`auth/Classes/${this.class.value}`, 'deleteAll')
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getSettingsData()
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء حذف البيانات');
              console.log(error);
            })
        } else if (target == "deleteSubClass") {
          let currentClass = this.classes.find((x) => x.key == this.class.value)?.value

          delete currentClass.SubClasses[this.subClass.value as any]

          this.firebaseAuthService.insertIntoDb(`auth/Classes/${this.class.value}`, currentClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getSettingsData()
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء حذف البيانات');
              console.log(error);
            })
        } else if (target == "deleteOption") {

          let currentClass = this.classes.find((x) => x.key == this.class.value)?.value

          delete currentClass.Options[this.option.value as any]

          this.firebaseAuthService.insertIntoDb(`auth/Classes/${this.class.value}`, currentClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getSettingsData()
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء حذف البيانات');
              console.log(error);
            })

        }
      }
    });
  }

  changeClass() {
    if (this.class.value == "0") {
      return
    }
    let currentClass = this.classes.find((x) => x.key == this.class.value)?.value
    console.log(currentClass);

    this.getSubClasses(currentClass)
    this.getOptions(currentClass)
  }

  changeDefaultClass() {

    if (this.defaultClass.value == "0") {
      return;
    }

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = "هل انت متأكد من تغيير الفرقة الحالية ؟";

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.firebaseAuthService.insertIntoDb(`auth/Classes/DefaultClass`, this.defaultClass.value)
          .then(() => {
            this.spinner.hide();
            this.swal.toastr('success', 'تم تعديل الفرقة الحالية بنجاح');
            window.location.reload()

          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr('error', 'حدث خطأ أثناء تعديل الفرقة الحالية');
            console.log(error);
          })

      }
    });
  }
}
