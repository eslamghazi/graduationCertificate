import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import * as XLSX from 'xlsx'; // Import the xlsx library
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from 'src/app/shared/swal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { map, catchError, of, forkJoin, Observable, from } from 'rxjs';
import { Router } from '@angular/router';
import { SearchStudentComponent } from '../search-student/search-student.component';
import { InvalidImagesComponent } from '../invalid-images/invalid-images.component';

@Component({
  selector: 'app-get-all-students-data',
  templateUrl: './get-all-students-data.component.html',
  styleUrls: ['./get-all-students-data.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disable encapsulation
})
export class GetAllStudentsDataComponent implements OnInit {
  currentClass = localStorage.getItem('currentClass')
  SubClasses: any[] = [];
  Options: any[] = [];

  superAdminCheck =
    localStorage.getItem('adminCheck')?.split('-')[0] == 'superadmin';

  data: any[] = [];
  filteredData: any[] = [];
  actualData: any[] = [];

  searchTerm: string = ''; // Holds the search input
  selectClass = new FormControl("0");
  selectUserType = new FormControl("0");

  currentPage = 1; // Current page of pagination
  itemsPerPage = 5; // Number of items per page

  constructor(
    private fireBaseAdminService: FireBaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  adminForm = new FormGroup({
    selectClass: this.selectClass,
    selectUserType: this.selectUserType,
  });

  ngOnInit() {
    this.getSubClassesOptions();
  }

  getSubClassesOptions() {
    this.spinner.show();
    this.fireBaseAdminService.getAllData(`/auth/Classes/${this.currentClass}`, "object").subscribe((data) => {
      for (let key in data.SubClasses) {
        this.SubClasses.push({ key: key, value: data.SubClasses[key] });
      }
      for (let key in data.Options) {
        this.Options.push({ key: key, value: data.Options[key] });
      }
      this.spinner.hide();
      console.log(this.SubClasses);
      console.log(this.Options);

    })
  }
  selectClassFunc(resetUserType = true) {
    this.spinner.show();
    resetUserType ? this.selectUserType.patchValue("0") : null;

    this.fireBaseAdminService.getAllData(`${this.currentClass}/${this.selectClass.value}/`).subscribe((result) => {
      this.data = result;
      this.filteredData = result;
      this.actualData = result;
      console.log(result);

      this.spinner.hide();
    });
  }

  selectUserTypeFunc() {
    this.spinner.show();
    if (this.selectUserType.value == "UploadedImages") {
      this.filterDataWithImages();
    } else if (this.selectUserType.value == "NotUpload") {
      this.filterDataWithOutImages();
    } else {
      this.spinner.hide();
    }
  }

  // Function to filter data based on the presence of the Image property
  filterDataWithImages() {
    this.spinner.show();
    this.filteredData = this.data?.filter((item) => item.Image); // Only include items with the Image property
    // this.data = this.filteredData; // Only include items with the Image property
    this.actualData = this.filteredData; // Only include items with the Image property
    this.currentPage = 1;
    this.spinner.hide();
  }

  // Function to filter data based on the presence of the Image property
  filterDataWithOutImages() {
    this.spinner.show();
    this.filteredData = this.data.filter((item) => !item.Image); // Only include items with the Image property
    // this.data = this.filteredData; // Only include items with the Image property
    this.actualData = this.filteredData; // Only include items with the Image property
    this.currentPage = 1;
    this.spinner.hide();
  }

  // Filter data based on search input
  search() {
    this.spinner.show();
    if (this.searchTerm) {
      // Perform search on the original dataArray to always start with the full dataset
      this.filteredData = this.actualData.filter(
        (item) =>
          (item.Name &&
            item.Name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (item.NationalId &&
            item.NationalId.toString().includes(this.searchTerm))
      );
      this.spinner.hide();
      console.log(this.filteredData);
    } else {
      // If search term is empty, reset to show all data with Image property
      this.selectUserType.value == 'UploadedImages'
        ? this.filterDataWithImages()
        : this.selectUserType.value == 'NotUpload'
          ? this.filterDataWithOutImages()
          : null;
      this.spinner.hide();
    }
    this.currentPage = 1; // Reset to the first page after search
  }

  // Export data to Excel with custom column order and index
  exportToExcel(): void {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تصدير بيانات الطلاب الموجودة في الجدول في شيت Excel ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        // Define the desired column order including index as 'Id'
        const columns = [
          'Id',
          'Name',
          'NationalId',
          'DateOfBirth',
          'PlaceOfBirth',
          'Image',
        ];

        // Transform the data to include an index and match the desired column order
        const orderedData = this.filteredData.map((item, index) => {
          const orderedItem: any = {};
          orderedItem['Id'] = this.getIndex(index); // Add index as 'Id'
          columns.slice(1).forEach((column) => {
            orderedItem[column] = item[column];
          });
          return orderedItem;
        });

        // Create a new workbook and a worksheet
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(orderedData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Generate a file and trigger download
        XLSX.writeFile(
          wb,
          `${this.selectUserType.value == 'UploadedImages'
            ? 'بيانات الطلاب الذين قاموا بوضع صورهم.xlsx'
            : this.selectUserType.value == 'NotUpload'
              ? 'بيانات الطلاب الذين لم يقوموا بوضع صورهم.xlsx'
              : null
          }`
        );
        this.spinner.hide();
      }
    });
  }

  openImage(item: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من فتح الصورة في تبويب اخر ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        console.log(item.Image);

        window.open(item.Image, '_blank');
      }
    });
  }

  getIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  exportAllPhotos() {
    const fileName =
      this.selectClass.value == 'June'
        ? 'الصور الخاصة بدور يونيو دفعة 2024'
        : this.selectClass.value == 'September'
          ? 'الصور الخاصة بدور سبتمبر دفعة 2024'
          : 'NotYet';

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = `هل انت متأكد من ضغط جميع ${fileName} ؟`;
    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const path = `${this.currentClass}/${this.selectClass.value}/`;

        this.fireBaseAdminService
          .downloadFolderAsZip(path, fileName)
          .then(() => {
            this.swal.toastr('success', 'تم تحضير الصور بنجاح');
            this.spinner.hide();
          })
          .catch((err) => {
            console.log(err);

            this.swal.toastr('error', 'حدث خطأ اثناء تحضير الصور');
            this.spinner.hide();
          });
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
      this.selectUserType.value == 'UploadedImages'
        ? 'هل انت متأكد من حذف الصورة الخاصة بالطالب ؟'
        : 'هل انت متأكد من حذف هذا الطالب ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        // this.fireBaseAdminService
        //   .deleteFileAndImageProperty(path, fileName)
        //   .then(() => {

        const path = `${this.currentClass}/${this.selectClass.value}/${item.NationalId}.jpg`

        const dbPath =
          `${this.currentClass}/${this.selectClass.value}/${item.NationalId}`

        if (target == 'deleteStudent') {
          this.fireBaseAdminService
            .removeImagePropertyFromDatabase(dbPath, 'deleteAll')
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف الطالب بنجاح');
              this.selectClassFunc(true);
            })
            .catch((err) => {
              this.spinner.hide();
              this.swal.toastr('error', 'حدث خطأ اثناء حذف الطالب');
              this.selectClassFunc(true);
            });
          return;
        } else {
          this.fireBaseAdminService
            .deleteFileAndImageProperty(path, dbPath, "deleteImageOnly")
            .subscribe(
              () => {
                this.spinner.hide();
                this.swal.toastr('success', 'تم حذف الصورة الخاصة بالطالب بنجاح');
                this.selectClassFunc(true);
              },
              (error) => {
                this.spinner.hide();
                this.swal.toastr(
                  'error',
                  'حدث خطأ اثناء حذف الصورة الخاصة بالطالب'
                );
                this.selectClassFunc(true);
              }
            );
        }
      }
    });
  }

  searchStudent() {
    const modalRef = this.modalService.open(SearchStudentComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
  }

  checkAndRemoveBrokenImages() {
    this.spinner.show();

    const dbPath =
      `${this.currentClass}/${this.selectClass.value}`

    const checkImageTasks: any[] = []; // Holds the observables for all image checks

    // Create observables for each student image check
    this.actualData.forEach((student) => {
      if (student.Image) {
        const imageCheck$ = this.fireBaseAdminService
          .checkImageUrl(student.Image)
          .pipe(
            map((isValid) => ({ student, isValid })),
            catchError(() => of({ student, isValid: false })) // Handle error case
          );

        checkImageTasks.push(imageCheck$);
      }
    });

    // Use forkJoin to wait for all image checks to complete
    if (checkImageTasks.length > 0) {
      forkJoin(checkImageTasks).subscribe((results) => {
        const invalidImages = results.filter((result) => !result.isValid);

        console.log('Invalid Images:', invalidImages); // Debugging

        // Check if there are invalid images
        if (invalidImages.length > 0) {
          const modalRef = this.modalService.open(InvalidImagesComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
          });

          // Passing data to the modal
          modalRef.componentInstance.data = invalidImages.map(
            (result) => result.student
          );

          // Handle modal result
          modalRef.result
            .then((result) => {
              if (result) {
                // If the user confirms, proceed with deletion
                const deletionTasks = invalidImages.map(({ student }) => {
                  const remove$ = this.removeImageForStudent(
                    `${dbPath}/${student.NationalId}`
                  );

                  return remove$ ? remove$ : of(null); // Ensure a valid observable
                });

                // Wait for all deletions to complete
                forkJoin(deletionTasks).subscribe(() => {
                  this.swal.toastr('success', 'تم حذف الصور بنجاح');
                  this.selectUserType.patchValue("0");
                });
              }
            })
            .catch((error) => {
              console.log('Modal dismissed with error:', error); // Debugging for modal dismissal
            });
        } else {
          // No invalid images found
          this.swal.toastr('info', 'لا توجد صور معطلة');
        }

        this.spinner.hide(); // Hide the spinner after processing
      });
    } else {
      // No students to check
      this.swal.toastr('info', 'لا توجد بيانات للتحقق منها');
      this.spinner.hide(); // Hide the spinner if there are no students
    }
  }

  removeImageForStudent(path: string): Observable<any> {
    return from(this.fireBaseAdminService.removeImageProperty(path)).pipe(
      map(() => {
        console.log(`Image property removed for student ${path}`);
        this.spinner.hide();
      }),
      catchError((error) => {
        console.error(`Error while removing image for student ${path}`, error);
        this.spinner.hide();
        return of(null); // Return a valid observable even on error
      })
    );
  }

  goEdit(ClassMonth: any, id: any) {

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
        this.router.navigateByUrl(
          `/student/editStudentData/${this.currentClass}/${ClassMonth}/${id}`
        );
      }
    });
  }
}
