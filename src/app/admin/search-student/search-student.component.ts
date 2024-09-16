import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-search-student',
  templateUrl: './search-student.component.html',
  styleUrls: ['./search-student.component.scss'],
})
export class SearchStudentComponent implements OnInit {
  data: any[] = [];

  clickSearch = false;

  checkedImages: { [key: string]: boolean } = {}; // Store image checks

  filteredData: any[] = [];
  currentPage = 1; // Current page of pagination
  itemsPerPage = 5; // Number of items per page
  searchTerm: string = ''; // Holds the search input

  constructor(
    public activeModal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private fireBaseAdminService: FireBaseAdminService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {}

  getIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  studentSearch() {
    this.clickSearch = false;
    if (this.searchTerm) {
      this.spinner.show();
      this.fireBaseAdminService
        .searchObject('Class2024Intership', this.searchTerm)
        .subscribe((result) => {
          console.log('first', result);
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
  // Function to check all images and store results
  checkAllImages(items: any[]): void {
    items.forEach((item) => {
      const imageUrl = item.data.Image;
      const key = item.data.NationalId;

      if (imageUrl) {
        // Call the service once per item and store the result
        this.fireBaseAdminService
          .checkImageUrl(imageUrl)
          .subscribe((result) => {
            this.checkedImages[key] = result;
          });
      } else {
        // If no image URL is provided, store false
        this.checkedImages[key] = false;
      }
    });
  }

  // Helper method to get the image check result
  hasImage(item: any): boolean {
    const key = item.data.NationalId;
    return this.checkedImages[key];
  }

  openImage(item: any) {
    window.open(item.data.Image, '_blank');
  }

  goEdit(ClassMonth: any, id: any) {
    console.log(ClassMonth);

    const classMonth =
      ClassMonth == 'June' ? '1' : ClassMonth == 'September' ? '2' : null;

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من الذهاب لقائمة تعديل الطالب';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.activeModal.dismiss();
        this.router.navigateByUrl(
          `/student/editStudentData/${classMonth}/${id}`
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

    // Passing data to the modal
    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message =
      target == 'deleteImage'
        ? 'هل انت متأكد من حذف الصورة الخاصة بالطالب ؟'
        : 'هل انت متأكد من حذف هذا الطالب ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();

        const path =
          item.source == 'June'
            ? `Class2024Intership/June/${item.data.NationalId}.jpg`
            : item.source == 'September'
            ? `Class2024Intership/September/${item.data.NationalId}.jpg`
            : 'NotYet';

        const dbPath =
          item.source == 'June'
            ? `Class2024Intership/June/${item.data.NationalId}`
            : item.source == 'September'
            ? `Class2024Intership/September/${item.data.NationalId}`
            : 'NotYet';

        const deleteState =
          target == 'deleteImage'
            ? `deleteImageOnly`
            : target == 'deleteStudent'
            ? `deleteAll`
            : 'NotYet';

        if (target == 'deleteStudent') {
          this.fireBaseAdminService
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
          return;
        }
        this.fireBaseAdminService
          .deleteFileAndImageProperty(path, dbPath, deleteState)
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
    });
  }
}
