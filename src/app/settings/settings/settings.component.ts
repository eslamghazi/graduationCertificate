import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';
import { AddEditSettingsComponent } from '../add-edit-settings/add-edit-settings.component';
import { SupabaseAuthService } from 'src/app/shared/supabase-auth.service';
import { SupabaseSettingsService } from 'src/app/shared/supabase-settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  superAdminCheck =
    localStorage.getItem('adminCheck')?.split('-')[0] === 'superadmin';
  authPrevilige = localStorage.getItem('adminCheck')?.split('-')[1];
  comingSoonStatus = false;

  allClassesData: any[] = [];
  classes: any[] = [];
  subClasses: any[] = [];
  options: any[] = [];

  class = new FormControl('0');
  subClass = new FormControl('0');
  option = new FormControl('0');
  currentClass = new FormControl('0');
  defaultClass = new FormControl('0');

  settingsForm = new FormGroup({
    class: this.class,
    subClass: this.subClass,
    option: this.option,
    currentClass: this.currentClass,
    defaultClass: this.defaultClass,
  });

  constructor(
    private supabaseSettingsService: SupabaseSettingsService,
    private supabaseAuthService: SupabaseAuthService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getComingSoonStatus();
    this.getSettingsData();

    this.getCurrentClass();
  }

  getCurrentClass() {
    this.supabaseAuthService
      .getDataByPath(`auth/${this.authPrevilige}`)
      .subscribe((userData) => {
        if (userData) {
          this.supabaseAuthService
            .getDataByPath('classes')
            .subscribe((classData) => {
              if (classData) {
                const userClass = userData.class_id;
                if (classData[userClass]) {
                  this.currentClass.setValue(userClass);
                } else {
                  this.currentClass.setValue(classData.default_class);
                }
              }
            });
        }
      });
  }

  getSettingsData() {
    this.spinner.show();
    this.classes = [];
    this.class.patchValue('0');

    this.supabaseSettingsService.getDataByPath('classes').subscribe((classesData) => {
      this.allClassesData = classesData || [];
      this.classes = this.allClassesData.map((cls: any) => ({
        key: cls.id,
        value: cls,
      }));

      this.supabaseSettingsService
        .getDataByPath('settings', { id: 'default_class' })
        .subscribe((authData) => {
          const defaultClassId = authData?.[0]?.value;
          this.defaultClass.setValue(defaultClassId || this.classes[0]?.key);

          const selectedClass =
            this.allClassesData.find(
              (cls: any) => cls.id === this.defaultClass.value
            ) || this.allClassesData[0];
          if (selectedClass) {
            this.getSubClasses(selectedClass.id);
            this.getOptions(selectedClass.id);
          }
          this.spinner.hide();
        });
    });
  }

  getSubClasses(classId: string) {
    this.spinner.show();
    this.subClasses = [];
    this.supabaseSettingsService
      .getDataByPath('subclasses', { class_id: classId })
      .subscribe((subClassesData) => {
        this.subClasses = (subClassesData || []).map((sub: any) => ({
          key: sub.id,
          value: sub,
        }));
        this.spinner.hide();
      });
  }

  getOptions(classId: string) {
    this.spinner.show();
    this.options = [];
    this.supabaseSettingsService
      .getDataByPath('options', { class_id: classId })
      .subscribe((optionsData) => {
        this.options = (optionsData || []).map((opt: any) => ({
          key: opt.id,
          value: opt,
        }));
        this.spinner.hide();
      });
  }

  getComingSoonStatus() {
    this.spinner.show();
    this.supabaseSettingsService
      .getDataByPath('settings', { id: 'coming_soon' })
      .subscribe((result: any) => {
        this.comingSoonStatus = result?.[0]?.value === 'true' ? true : false;
        this.spinner.hide();
      });
  }

  changeComingSoon() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = this.comingSoonStatus
      ? 'هل انت متأكد من ايقاف واجهة Coming Soon ؟'
      : 'هل انت متأكد من تفعيل واجهة Coming Soon ؟';

    modalRef.result.then((result) => {
      if (result) {
        const newStatus = !this.comingSoonStatus;
        this.supabaseSettingsService
          .insertIntoDb(
            'settings',
            { id: 'coming_soon', value: newStatus },
            true
          )
          .then(() => {
            window.location.reload();
          });
      }
    });
  }

  add(target: string) {
    if (
      (target === 'addSubClass' || target === 'addOption') &&
      this.class.value === '0'
    ) {
      this.swal.toastr('error', 'يرجى اختيار الفرقة');
      return;
    }
    const modalRef = this.modalService.open(AddEditSettingsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.header = 'اضافة بيانات جديدة';
    modalRef.componentInstance.footer = 'اضافة';
    modalRef.componentInstance.isReadonly = false;

    modalRef.result.then((result) => {
      if (result) {
        if (target === 'addClass') {
          this.spinner.show();
          const defaultSubClass = [
            { id: `${result.id}-June`, name: 'يونيو', class_id: result.id },
            {
              id: `${result.id}-September`,
              name: 'سبتمبر',
              class_id: result.id,
            },
          ];
          const defaultOptions = [
            {
              id: `${result.id}-NotUpload`,
              name: 'الطلاب الذين لم يقوموا برفع صورهم',
              class_id: result.id,
            },
            {
              id: `${result.id}-UploadedImages`,
              name: 'الطلاب الذين قاموا برفعوا صورهم',
              class_id: result.id,
            },
          ];

          this.supabaseSettingsService
            .insertIntoDb('classes', result)
            .then(() => {
              return this.supabaseSettingsService.insertIntoDb(
                'subclasses',
                defaultSubClass
              );
            })
            .then(() => {
              return this.supabaseSettingsService.insertIntoDb(
                'options',
                defaultOptions
              );
            })
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم اضافة البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء اضافة البيانات');
              console.log(error);
            });
        } else if (target === 'addSubClass') {
          this.spinner.show();
          const currentClass = this.classes.find(
            (x) => x.key === this.class.value
          )?.value;
          const newSubClass = {
            ...result,
            id: `${currentClass.id}-${result.id}`,
            class_id: currentClass.id,
          };
          this.supabaseSettingsService
            .insertIntoDb('subclasses', newSubClass)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم اضافة البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء اضافة البيانات');
              console.log(error);
            });
        } else if (target === 'addOption') {
          this.spinner.show();
          const currentClass = this.classes.find(
            (x) => x.key === this.class.value
          )?.value;
          const newOption = {
            ...result,
            id: `${currentClass.id}-${result.id}`,
            class_id: currentClass.id,
          };
          this.supabaseSettingsService
            .insertIntoDb('options', newOption)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم اضافة البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء اضافة البيانات');
              console.log(error);
            });
        }
      }
    });
  }

  edit(target: string) {
    if (
      (target === 'editClass' && this.class.value === '0') ||
      (target === 'editSubClass' && this.subClass.value === '0') ||
      (target === 'editOption' && this.option.value === '0')
    ) {
      return;
    }

    const modalRef = this.modalService.open(AddEditSettingsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.header = 'تعديل البيانات';
    modalRef.componentInstance.footer = 'تعديل';
    modalRef.componentInstance.isReadonly = true;
    modalRef.componentInstance.data =
      target === 'editClass'
        ? this.classes.find((x) => x.key === this.class.value)?.value
        : target === 'editSubClass'
        ? this.subClasses.find((x) => x.key === this.subClass.value)?.value
        : this.options.find((x) => x.key === this.option.value)?.value;

    modalRef.result.then((result) => {
      if (result) {
        if (target === 'editClass') {
          this.spinner.show();
          this.supabaseSettingsService
            .insertIntoDb('classes', result, true)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم تعديل البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء تعديل البيانات');
              console.log(error);
            });
        } else if (target === 'editSubClass') {
          this.spinner.show();
          this.supabaseSettingsService
            .insertIntoDb('subclasses', result, true)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم تعديل البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء تعديل البيانات');
              console.log(error);
            });
        } else if (target === 'editOption') {
          this.spinner.show();
          this.supabaseSettingsService
            .insertIntoDb('options', result, true)
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم تعديل البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء تعديل البيانات');
              console.log(error);
            });
        }
      }
    });
  }

  delete(target: string) {
    if (
      (target === 'deleteClass' && this.class.value === '0') ||
      (target === 'deleteSubClass' && this.subClass.value === '0') ||
      (target === 'deleteOption' && this.option.value === '0')
    ) {
      return;
    }

    if (this.defaultClass.value === this.class.value) {
      this.swal.toastr(
        'info',
        'لا يمكن حذف هذه الفرقة نظرًا لانها الفرقة الإفتراضية'
      );
      return;
    }

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من حذف البيانات ؟';

    modalRef.result.then((result) => {
      if (result) {
        if (target === 'deleteClass') {
          this.spinner.show();
          this.supabaseSettingsService
            .removeImagePropertyFromDatabase(
              'classes',
              this.class.value!,
              'deleteAll'
            )
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء حذف البيانات');
              console.log(error);
            });
        } else if (target === 'deleteSubClass') {
          this.spinner.show();
          this.supabaseSettingsService
            .removeImagePropertyFromDatabase(
              'subclasses',
              this.subClass.value!,
              'deleteAll'
            )
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء حذف البيانات');
              console.log(error);
            });
        } else if (target === 'deleteOption') {
          this.spinner.show();
          this.supabaseSettingsService
            .removeImagePropertyFromDatabase(
              'options',
              this.option.value!,
              'deleteAll'
            )
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getSettingsData();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ أثناء حذف البيانات');
              console.log(error);
            });
        }
      }
    });
  }

  changeClass() {
    if (this.class.value === '0') {
      this.subClasses = [];
      this.options = [];
      return;
    }

    const currentClass = this.classes.find(
      (x) => x.key === this.class.value
    )?.value;
    this.getSubClasses(currentClass.id);
    this.getOptions(currentClass.id);
  }

  changeDefaultClass() {
    if (this.defaultClass.value === '0') {
      return;
    }

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تغيير الفرقة الإفتراضية ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.supabaseSettingsService
          .insertIntoDb(
            'settings',
            { id: 'default_class', value: this.defaultClass.value },
            true
          )
          .then(() => {
            this.spinner.hide();
            this.swal.toastr('success', 'تم تعديل الفرقة الإفتراضية بنجاح');
            window.location.reload();
          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr('error', 'حدث خطأ أثناء تعديل الفرقة الإفتراضية');
            console.log(error);
          });
      }
    });
  }

  changeCurrentClass() {
    if (this.currentClass.value === '0') {
      return;
    }

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تغيير الفرقة الحالية ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.supabaseSettingsService
          .insertIntoDb(
            'auth',
            { id: this.authPrevilige, class_id: this.currentClass.value },
            true
          )
          .then(() => {
            this.spinner.hide();
            this.swal.toastr('success', 'تم تعديل الفرقة الحالية بنجاح');
            window.location.reload();
          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr('error', 'حدث خطأ أثناء تعديل الفرقة الحالية');
            console.log(error);
          });
      }
    });
  }
}
