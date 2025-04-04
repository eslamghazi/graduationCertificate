import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { SupabaseAdminService } from 'src/app/shared/supabase-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-add-edit-admin',
  templateUrl: './add-edit-admin.component.html',
  styleUrls: ['./add-edit-admin.component.scss'],
})
export class AddEditAdminComponent implements OnInit, OnDestroy {
  @Input() header: string = '';
  @Input() data: any;
  classes: any[] = [];

  Name = new FormControl(null, [Validators.required]);
  NationalId = new FormControl(null, [Validators.required]);
  Auth = new FormControl(0, [Validators.required]);
  class = new FormControl(null, [Validators.required]);

  editForm = new FormGroup({
    Name: this.Name,
    NationalId: this.NationalId,
    Auth: this.Auth,
    class: this.class,
  });

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private supabaseAdminService: SupabaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.editForm.patchValue({
        Name: this.data.Name,
        NationalId: this.data.NationalId,
        Auth:
          this.data.Auth.toString().toLowerCase() === 'admin'
            ? 1
            : this.data.Auth.toString().toLowerCase() === 'sudoadmin'
            ? 2
            : 3,
        class: this.data.Class,
      });
      document.getElementById('idInput')?.setAttribute('readonly', "true");
    }
    this.getClassesData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  confirm() {
    const data = {
      id: this.NationalId.value,
      name: this.Name.value,
      auth_level:
        this.Auth.value == 1
          ? 'admin'
          : this.Auth.value == 2
          ? 'sudoadmin'
          : 'superadmin',
      class_id: this.class.value,
    };

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = this.data
      ? 'هل انت متأكد من تعديل بيانات الأدمن ؟'
      : 'هل انت متأكد من إضافة الأدمن ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.supabaseAdminService
          .upsertData([data], 'auth')
          .then(() => {
            this.spinner.hide();
            this.swal.toastr(
              'success',
              this.data ? 'تم تعديل الأدمن بنجاح' : 'تمت إضافة الأدمن بنجاح'
            );
            this.activeModal.close(true);
          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr(
              'error',
              this.data
                ? 'حدث خطأ أثناء تعديل الأدمن'
                : 'حدث خطأ أثناء إضافة الأدمن'
            );
            this.activeModal.close(false);
            console.error(error);
          });
      }
    });
  }

  typingId(event: any) {
    const value = event.value;
    if (value) {
      if (value.toString().length !== 14) {
        this.NationalId.setErrors({ pattern: true });
      }
    }
  }

  getClassesData() {
    this.spinner.show();
    this.classes = [];
    const sub = this.supabaseAdminService
      .getAllData('classes')
      .subscribe({
        next: (data) => {
          this.classes = data.map((cls: any) => ({
            key: cls.id,
            value: { Id: cls.id, Name: cls.name },
          }));
          this.spinner.hide();
        },
        error: (error) => {
          this.spinner.hide();
          this.swal.toastr('error', 'حدث خطأ أثناء تحميل الفرق');
          console.error(error);
        },
      });
    this.subscriptions.push(sub);
  }
}
