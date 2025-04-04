import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { SupabaseAdminService } from 'src/app/shared/supabase-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';
import { AddEditAdminComponent } from '../add-edit-admin/add-edit-admin.component';

@Component({
  selector: 'app-admin-manage',
  templateUrl: './admin-manage.component.html',
  styleUrls: ['./admin-manage.component.scss'],
})
export class AdminManageComponent implements OnInit, OnDestroy {
  admins: any[] = [];
  filteredAdmins: any[] = [];

  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private supabaseAdminService: SupabaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getAuthData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getAuthData() {
    this.spinner.show();
    const sub = this.supabaseAdminService
      .getAllData('auth')
      .subscribe({
        next: (result) => {
          this.admins = result.map((admin: any) => ({
            key: admin.id,
            data: {
              Name: admin.name,
              NationalId: admin.id,
              Auth: admin.auth_level,
              Class: admin.class_id,
            },
          }));
          this.filteredAdmins = this.admins;
          this.spinner.hide();
        },
        error: (error) => {
          this.spinner.hide();
          this.swal.toastr('error', 'حدث خطأ أثناء تحميل بيانات الأدمن');
        },
      });
    this.subscriptions.push(sub);
  }

  deleteAdmin(item: any) {

    const path = `/auth/${item.data.NationalId}`;

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من حذف الأدمن';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.supabaseAdminService
          .removeImagePropertyFromDatabase(path, 'deleteAuthor', 'auth')
          .then(() => {
            this.spinner.hide();
            this.swal.toastr('success', 'تم حذف الأدمن بنجاح');
            this.getAuthData();
          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr('error', 'عفوًا حدث خطأ أثناء حذف الأدمن');
            this.getAuthData();
          });
      }
    });
  }

  addEditAdmin(target: string, item?: any) {
    const modalRef = this.modalService.open(AddEditAdminComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.header =
      target === 'editAdmin' ? 'تعديل بيانات الأدمن' : 'اضافة أدمن جديد';
    modalRef.componentInstance.data = target === 'editAdmin' ? item.data : null;

    modalRef.result.then((result) => {
      if (result) {
        this.getAuthData();
      }
    });
  }

  search() {
    if (this.searchTerm) {
      this.spinner.show();
      this.filteredAdmins = this.admins.filter(
        (item) =>
          (item.data.Name &&
            item.data.Name.toLowerCase().includes(
              this.searchTerm.toLowerCase()
            )) ||
          (item.data.NationalId &&
            item.data.NationalId.toString().includes(this.searchTerm))
      );
      this.spinner.hide();
    } else {
      this.filteredAdmins = this.admins;
    }
    this.currentPage = 1;
  }
}
