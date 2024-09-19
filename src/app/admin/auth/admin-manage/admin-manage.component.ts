import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { FireBaseAuthService } from 'src/app/shared/fire-base-auth.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';
import { AddEditAdminComponent } from '../add-edit-admin/add-edit-admin.component';

@Component({
  selector: 'app-admin-manage',
  templateUrl: './admin-manage.component.html',
  styleUrls: ['./admin-manage.component.scss'],
})
export class AdminManageComponent implements OnInit {
  admins: any[] = [];
  filteredAdmins: any[] = [];

  comingSoonStatus = false;

  searchTerm: string = '';
  itemsPerPage: any = 5;
  currentPage: number = 1;

  constructor(
    private firebaseAuthService: FireBaseAuthService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getAuthData();
  }

  getAuthData() {
    this.spinner.show();
    this.firebaseAuthService.getAuthData('/auth').subscribe((result) => {
      this.admins = result.filter(
        (auth) => auth.key != 'comingSoon' && auth.key != 'Classes'
      );
      this.comingSoonStatus = result.filter(
        (auth) => auth.key == 'comingSoon'
      )[0]?.data;
      this.filteredAdmins = this.admins;
      console.log(this.comingSoonStatus);
      console.log(this.admins);
      this.spinner.hide();
    });
  }

  deleteAdmin(item: any) {
    const path = `/auth/${item.data.NationalId}`;
    console.log(item);

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من حذف الأدمن';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        this.firebaseAuthService
          .removeImagePropertyFromDatabase(path, 'deleteAll')
          .then(() => {
            this.spinner.hide();
            this.swal.toastr('success', 'تم حذف البيانات بنجاح');
            this.getAuthData();
          })
          .catch((error) => {
            this.spinner.hide();
            this.swal.toastr('error', 'عفوًا حدث خطأ أثناء حذف البيانات');
            this.getAuthData();
          });
      }
    });
  }

  addEditAdmin(target: any, item?: any) {
    console.log(item);

    const modalRef = this.modalService.open(AddEditAdminComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.header =
      target == 'editAdmin' ? 'تعديل بيانات الأدمن' : 'اضافة أدمن جديد';
    modalRef.componentInstance.data = target == 'editAdmin' ? item.data : null;

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
      }
    });
  }

  search() {
    if (this.searchTerm) {
      this.spinner.show();
      // Perform search on the original dataArray to always start with the full dataset
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
      console.log(this.filteredAdmins);
    } else {
      this.getAuthData();
    }
    this.currentPage = 1; // Reset to the first page after search
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
}
