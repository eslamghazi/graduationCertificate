import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SupabaseAdminService } from 'src/app/shared/supabase-admin.service';
import * as XLSX from 'xlsx';
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
  encapsulation: ViewEncapsulation.None,
})
export class GetAllStudentsDataComponent implements OnInit {
  currentClass = localStorage.getItem('currentClass');
  subClasses: any[] = [];
  options: any[] = [];

  superAdminCheck =
    localStorage.getItem('adminCheck')?.split('-')[0] === 'superadmin';

  data: any[] = [];
  filteredData: any[] = [];
  actualData: any[] = [];
  rowClass: any = {};
  searchTerm: string = '';
  searchType: string = 'all';
  selectClass = new FormControl('0');
  selectUserType = new FormControl('0');

  currentPage = 1;
  itemsPerPage = 5;

  goToPageNumber: number | null = null;
  showPageNotFound = false;

  constructor(
    private supabaseAdminService: SupabaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  adminForm = new FormGroup({
    selectClass: this.selectClass,
    selectUserType: this.selectUserType,
  });

  ngOnInit() {
    this.getRowClass()
      if (this.currentClass) {
        this.getSubClassesOptions();
      }
  }

  getRowClass () {
    this.spinner.show();
    this.supabaseAdminService.getAllData('classes').subscribe((result) => {
      this.rowClass = result.find((x: any) => x.id === this.currentClass);
      this.spinner.hide();
    })
  }

  getSubClassesOptions() {
    this.spinner.show();
    forkJoin([
      this.supabaseAdminService.getAllData('subclasses', { class_id: this.currentClass }),
      this.supabaseAdminService.getAllData('options', { class_id: this.currentClass }),
    ]).subscribe(([subClassesData, optionsData]) => {
      this.subClasses = (subClassesData || []).map((sub: any) => ({
        key: sub.id,
        value: sub,
      }));
      this.options = (optionsData || []).map((opt: any) => ({
        key: opt.id,
        value: opt,
      }));
      this.spinner.hide();
    });
  }

  selectClassFunc(resetUserType = true) {
    this.spinner.show();
    if (resetUserType) this.selectUserType.patchValue('0');

    this.supabaseAdminService
      .getAllData('students', {
        class_id: this.currentClass,
        subclass_id: this.selectClass.value,
      })
      .subscribe((result) => {
        this.data = result || [];
        this.filteredData = result || [];
        this.actualData = result || [];
        this.spinner.hide();
      });

    }

  selectUserTypeFunc() {
    this.spinner.show();
    if (this.selectUserType.value === `${this.currentClass}-UploadedImages`) {
      this.filterDataWithImages();
    } else if (this.selectUserType.value === `${this.currentClass}-NotUpload`) {
      this.filterDataWithOutImages();
    } else {
      this.filteredData = this.data;
      this.actualData = this.data;
      this.currentPage = 1;
      this.spinner.hide();
    }
  }

  filterDataWithImages() {
    this.spinner.show();
    this.filteredData = this.data?.filter((item) => item.image_url);
    this.actualData = this.filteredData;
    this.currentPage = 1;
    this.spinner.hide();
  }

  filterDataWithOutImages() {
    this.spinner.show();
    this.filteredData = this.data.filter((item) => !item.image_url);
    this.actualData = this.filteredData;
    this.currentPage = 1;
    this.spinner.hide();
  }

  getSearchPlaceholder() {
    switch (this.searchType) {
      case 'name': return 'البحث بالإسم';
      case 'id': return 'البحث بالرقم القومي';
      case 'place_of_birth': return 'البحث بمحل الميلاد';
      case 'mozaola': return 'البحث بعدد محاولات مزاولة المهنة';
      case 'all': default: return 'البحث بالإسم و الرقم القومي';
    }
  }

  search() {
    this.spinner.show();
    if (this.searchTerm) {
      this.filteredData = this.actualData.filter(
        (item) => {
          const matchesName = item.name && item.name.toLowerCase().includes(this.searchTerm.toLowerCase());
          const matchesNameEn = item.name_en && item.name_en.toLowerCase().includes(this.searchTerm.toLowerCase());
          const matchesId = item.id && item.id.toString().includes(this.searchTerm);
          const matchesPlaceOfBirth = item.place_of_birth && item.place_of_birth.toLowerCase().includes(this.searchTerm.toLowerCase());
          
          let isMozaolaValue = item.is_mozaola == 0 || !item.is_mozaola ? '0' : item.is_mozaola.toString();
          const matchesMozaola = isMozaolaValue.includes(this.searchTerm);

          if (this.searchType === 'name') {
            return matchesName || matchesNameEn;
          } else if (this.searchType === 'id') {
            return matchesId;
          } else if (this.searchType === 'place_of_birth') {
            return matchesPlaceOfBirth;
          } else if (this.searchType === 'mozaola') {
             return matchesMozaola;
          } else {
            return matchesName || matchesNameEn || matchesId;
          }
        }
      );
      this.spinner.hide();
    } else {
      this.selectUserType.value === `${this.currentClass}-UploadedImages`
        ? this.filterDataWithImages()
        : this.selectUserType.value === `${this.currentClass}-NotUpload`
        ? this.filterDataWithOutImages()
        : (this.filteredData = this.data);
      this.spinner.hide();
    }
    this.currentPage = 1;
  }

  exportToExcel(): void {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تصدير بيانات الطلاب الموجودة في الجدول في شيت Excel ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const columns = [
          'id',
          'name',
          'date_of_birth',
          'place_of_birth',
          'class_id',
          'subclass_id',
          'is_mozaola',
          'image_url',
        ];

        const orderedData = this.filteredData.map((item, index) => {
          const orderedItem: any = {};
          orderedItem['id'] = this.getIndex(index);
          orderedItem['national_id'] = item.id;

          columns.slice(1).forEach((column) => {
            orderedItem[column] = item[column];
          });
          return orderedItem;
        });

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(orderedData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        XLSX.writeFile(
          wb,
          `${
            this.selectUserType.value === `${this.currentClass}-UploadedImages`
              ? 'بيانات الطلاب الذين قاموا بوضع صورهم.xlsx'
              : this.selectUserType.value === `${this.currentClass}-NotUpload`
              ? 'بيانات الطلاب الذين لم يقوموا بوضع صورهم.xlsx'
              : 'بيانات_الطلاب.xlsx'
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

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من فتح الصورة في تبويب اخر ؟';

    modalRef.result.then((result) => {
      if (result) {
        window.open(item.image_url, '_blank');
      }
    });
  }

  getIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  exportAllPhotos() {
    const rowSubClass = this.subClasses.find(
      (x) => x.key === this.selectClass.value)

    const fileName = `الصور الخاصة بـ ${this.rowClass.name} دور ${rowSubClass.value.name}`;

    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = `هل انت متأكد من ضغط جميع ${fileName} ؟`;

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const path = `${this.currentClass}/${this.selectClass.value}`;

        this.supabaseAdminService
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

    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message =
      this.selectUserType.value === `${this.currentClass}-UploadedImages`
        ? 'هل انت متأكد من حذف الصورة الخاصة بالطالب ؟'
        : 'هل انت متأكد من حذف هذا الطالب ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const path = `${this.currentClass}/${this.selectClass.value}/${this.supabaseAdminService.encryptFileName(item.id + "_" + item.name + ".jpg")}`;
        const dbPath = `${this.currentClass}/${this.selectClass.value}/${item.id}`;

        if (target === 'deleteStudent') {
          this.supabaseAdminService
            .removeImagePropertyFromDatabase(dbPath, 'deleteAll')
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف الطالب بنجاح');
              [this.data, this.filteredData, this.actualData].forEach(arr => {
                const idx = arr.findIndex((s) => s.id === item.id);
                if (idx !== -1) arr.splice(idx, 1);
              });
              const prevPage = this.currentPage;
              if (this.selectUserType.value === `${this.currentClass}-UploadedImages`) {
                this.filterDataWithImages();
              } else if (this.selectUserType.value === `${this.currentClass}-NotUpload`) {
                this.filterDataWithOutImages();
              }
              this.currentPage = prevPage;
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
                [this.data, this.filteredData, this.actualData].forEach(arr => {
                  const found = arr.find((s) => s.id === item.id);
                  if (found) found.image_url = null;
                });
                // Re-filter the data if the current filter is for students with images
                const prevPage = this.currentPage;
                if (this.selectUserType.value === `${this.currentClass}-UploadedImages`) {
                  this.filterDataWithImages();
                } else if (this.selectUserType.value === `${this.currentClass}-NotUpload`) {
                  this.filterDataWithOutImages();
                }
                this.currentPage = prevPage;
              },
              (error) => {
                this.spinner.hide();
                this.swal.toastr(
                  'error',
                  'حدث خطأ اثناء حذف الصورة الخاصة بالطالب'
                );
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
    const dbPath = `${this.currentClass}/${this.selectClass.value}`;

    const checkImageTasks: any[] = [];

    this.actualData.forEach((student) => {
      if (student.image_url) {
        const imageCheck$ = this.supabaseAdminService
          .checkImageUrl(student.image_url)
          .pipe(
            map((isValid) => ({ student, isValid })),
            catchError(() => of({ student, isValid: false }))
          );
        checkImageTasks.push(imageCheck$);
      }
    });

    if (checkImageTasks.length > 0) {
      forkJoin(checkImageTasks).subscribe((results) => {
        const invalidImages = results.filter((result) => !result.isValid);

        if (invalidImages.length > 0) {
          const modalRef = this.modalService.open(InvalidImagesComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
          });

          modalRef.componentInstance.data = invalidImages.map(
            (result) => result.student
          );

          modalRef.result
            .then((result) => {
              if (result) {
                const deletionTasks = invalidImages.map(({ student }) => {
                  const remove$ = this.removeImageForStudent(
                    `${dbPath}/${student.id}`
                  );
                  return remove$ ? remove$ : of(null);
                });

                forkJoin(deletionTasks).subscribe(() => {
                  this.swal.toastr('success', 'تم حذف الصور بنجاح');
                  this.selectUserType.patchValue('0');
                  window.location.reload();
                });
              }
            })
            .catch((error) => {
              console.log('Modal dismissed with error:', error);
            });
        } else {
          this.swal.toastr('info', 'لا توجد صور معطلة');
        }

        this.spinner.hide();
      });
    } else {
      this.swal.toastr('info', 'لا توجد بيانات للتحقق منها');
      this.spinner.hide();
    }
  }

  removeImageForStudent(path: string): Observable<any> {
    return from(this.supabaseAdminService.removeImagePropertyFromDatabase(path, "deleteImageOnly")).pipe(
      map(() => {
        this.spinner.hide();
      }),
      catchError((error) => {
        console.error(`Error while removing image for student ${path}`, error);
        this.spinner.hide();
        return of(null);
      })
    );
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
        this.router.navigateByUrl(
          `/student/editStudentData/${this.currentClass}/${classMonth}/${id}`
        );
      }
    });
  }

  get totalPages(): number {
    return Math.ceil((this.filteredData?.length || 0) / this.itemsPerPage);
  }

  goToPage() {
    this.showPageNotFound = false;
    if (
      this.goToPageNumber &&
      this.goToPageNumber >= 1 &&
      this.goToPageNumber <= this.totalPages
    ) {
      this.currentPage = this.goToPageNumber;
    } else {
      this.showPageNotFound = true;
    }
  }
}
