import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupabaseAdminService } from 'src/app/shared/supabase-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-search-student',
  templateUrl: './search-student.component.html',
  styleUrls: ['./search-student.component.scss'],
})
export class SearchStudentComponent implements OnInit {
  currentClass = localStorage.getItem('currentClass');
  subClasses: any[] = [];

  data: any[] = [];
  filteredData: any[] = [];
  clickSearch = false;

  checkedImages: { [key: string]: boolean } = {};

  currentPage = 1;
  itemsPerPage = 5;
  searchTerm: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private supabaseAdminService: SupabaseAdminService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getSubClasses();
  }

  getSubClasses() {
    this.spinner.show();
    this.supabaseAdminService
      .getAllData('subclasses', { class_id: this.currentClass })
      .subscribe((data) => {
        this.subClasses = (data || []).map((sub: any) => ({
          key: sub.id,
          value: sub,
        }));
        this.spinner.hide();
      });
  }

  getIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  studentSearch() {
    this.clickSearch = false;
    const dataBaseGroups: string[] = this.subClasses.map(
      (sub) => `${this.currentClass}/${sub.value.id}`
    );

    if (this.searchTerm) {
      this.spinner.show();
      this.supabaseAdminService
        .searchObject(
          this.subClasses.map((sub) => sub.value.id),
          this.searchTerm
        )
        .subscribe((result) => {
          this.data = result;
          this.filteredData = result;
          this.checkAllImages(result);
          this.clickSearch = true;
          this.spinner.hide();
        });
    } else {
      this.clickSearch = false;
    }
  }

  checkAllImages(items: any[]): void {
    items.forEach((item) => {
      const imageUrl = item.data.image_url;
      const key = item.data.id;

      if (imageUrl) {
        this.supabaseAdminService
          .checkImageUrl(imageUrl)
          .subscribe((result) => {
            this.checkedImages[key] = result;
          });
      } else {
        this.checkedImages[key] = false;
      }
    });
  }

  hasImage(item: any): boolean {
    const key = item.data.id;
    return this.checkedImages[key] || false;
  }

  openImage(item: any) {
    window.open(item.data.image_url, '_blank');
  }

  goEdit(classMonth: any, id: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من الذهاب لقائمة تعديل الطالب';

    modalRef.result.then((result) => {
      if (result) {
        this.activeModal.dismiss();
        this.router.navigateByUrl(
          `/student/editStudentData/${this.currentClass}/${classMonth}/${id}`
        );
      }
    });
  }

  deleteStudent(item: any, target?: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message =
      target === 'deleteImage'
        ? 'هل انت متأكد من حذف الصورة الخاصة بالطالب ؟'
        : 'هل انت متأكد من حذف هذا الطالب ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const path = `${this.currentClass}/${item.source}/${this.supabaseAdminService.encryptFileName(item.data.id + "_" + item.data.name + ".jpg")}`;
        const dbPath = `${this.currentClass}/${item.source}/${item.data.id}`;

        if (target === 'deleteStudent') {
          this.supabaseAdminService
            .removeImagePropertyFromDatabase(dbPath, 'deleteAll')
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف الطالب بنجاح');
              this.studentSearch();
            })
            .catch((err) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ اثناء حذف الطالب');
            });
        } else {
          this.supabaseAdminService
            .deleteFileAndImageProperty(path, dbPath, 'deleteImageOnly')
            .subscribe(
              () => {
                this.spinner.hide();
                this.swal.toastr('success', 'تم حذف الصورة الخاصة بالطالب بنجاح');
                this.studentSearch();
              },
              (error) => {
                this.spinner.hide();
                this.swal.toastr(
                  'error',
                  'حدث خطأ اثناء حذف الصورة الخاصة بالطالب'
                );
                this.studentSearch();
              }
            );
        }
      }
    });
  }
}
