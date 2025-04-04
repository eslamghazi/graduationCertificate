import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { SupabaseAdminService } from 'src/app/shared/supabase-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-upload-excel',
  templateUrl: './upload-excel.component.html',
  styleUrls: ['./upload-excel.component.scss'],
})
export class UploadExcelComponent implements OnInit, OnDestroy {
  currentClass = localStorage.getItem('currentClass');
  data: any;
  firebaseData: any;

  flatData: any[] = [];
  filteredData: any[] = [];
  model: string = 'upload';
  currentPage = 1;
  itemsPerPage = 5;
  searchTerm: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private supabaseAdminService: SupabaseAdminService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) {}

  ngOnInit(): void {
    this.data = null;
    this.firebaseData = null;
    this.flatData = [];
    this.filteredData = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.searchTerm = '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onFileChange(event: any): void {
    const target: DataTransfer = event.target as DataTransfer;

    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }

    const file: File = target.files[0];

    this.supabaseAdminService
      .processExcelFile(file)
      .then((structuredData: any) => {
        this.data = structuredData;
        this.flatData = this.flattenData(this.data);
        this.filteredData = this.flatData;
      })
      .catch((error) => {
        console.error('Error processing Excel file:', error);
        this.swal.toastr('error', 'حدث خطأ أثناء معالجة ملف الإكسل');
      });
  }

  flattenData(structuredData: any[]): any[] {
    const result: any[] = [];
    const monthMap: { [key: string]: any[] } = {};

    structuredData.forEach((student, index) => {
      const month = student.subclass_id.split('-').pop();
      if (!monthMap[month]) {
        monthMap[month] = [];
      }
      monthMap[month].push({
        id: index + 1,
        Name: student.name,
        NationalId: student.national_id,
        DateOfBirth: student.date_of_birth,
        PlaceOfBirth: student.place_of_birth,
        ClassMonth: month,
      });
    });

    Object.keys(monthMap).forEach((month) => {
      result.push({ isMonthBreak: true, month });
      result.push(...monthMap[month]);
    });

    return result;
  }

  confirm() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      this.model === 'upload'
        ? 'هل انت متأكد من رفع هذه البيانات ؟'
        : 'هل انت متأكد من حذف هذه البيانات ؟';

    modalRef.result.then((result) => {
      if (result) {

        let updatedData = this.data.map((item: { national_id?: string; [key: string]: any }) => {
          const { national_id, ...rest } = item;
          return rest;
        });

          const sub = this.supabaseAdminService
          .getAllData('students', { class_id: this.currentClass })
          .subscribe({
            next: async (existingStudents: any[]) => {
              if (existingStudents && existingStudents.length > 0) {
                if (this.model === 'upload') {

                  this.firebaseData = existingStudents;
                  const mergedData = this.mergeData(this.firebaseData, updatedData);
                  await this.supabaseAdminService.upsertData(mergedData, 'students');
                } else {
                  this.firebaseData = existingStudents;
                  const idsToDelete = this.getIdsToDelete(this.firebaseData, updatedData);
                  await this.supabaseAdminService.deleteMultiple(idsToDelete, 'students');
                }
              } else {
                if (this.model === 'upload') {

                  await this.supabaseAdminService.upsertData(updatedData, 'students');
                }
              }

              this.spinner.hide();
              this.swal.toastr(
                'success',
                this.model === 'upload' ? 'تم رفع البيانات بنجاح' : 'تم حذف البيانات بنجاح'
              );
              this.activeModal.close(true);
            },
            error: (error) => {
              this.spinner.hide();
              this.swal.toastr(
                'error',
                this.model === 'upload' ? 'خطأ في رفع البيانات' : 'خطأ في حذف البيانات'
              );
              console.error(error);
            },
            complete: () => {
              sub.unsubscribe();
            },
          });
        this.subscriptions.push(sub);
      }
    });
  }

  mergeData(existingStudents: any[], newStudents: any[]): any[] {

    const existingMap = new Map<string, any>();
    existingStudents.forEach((student) => {
      existingMap.set(student.id, student);
    });

    const mergedData: any[] = [...existingStudents];
    newStudents.forEach((newStudent) => {
      const existingIndex = mergedData.findIndex((s) => s.id === newStudent.id);
      if (existingIndex !== -1) {
        mergedData[existingIndex] = { ...mergedData[existingIndex], ...newStudent };
      } else {
        mergedData.push(newStudent);
      }
    });

    return mergedData;
  }

  getIdsToDelete(existingStudents: any[], excelStudents: any[]): string[] {
    const excelIds = new Set(excelStudents.map((student) => student.id));
    return existingStudents
      .filter((student) => excelIds.has(student.id))
      .map((student) => student.id);
  }

  search() {
    const query = this.searchTerm.toLowerCase();
    this.filteredData = this.flatData.filter((entry: any) => {
      if (entry.isMonthBreak) {
        return true;
      }
      const matchesName = entry.Name.toLowerCase().includes(query);
      const matchesNationalId = entry.NationalId.toString().includes(query);
      return matchesName || matchesNationalId;
    });

    this.currentPage = 1;
  }

  closeModal() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من إلغاء هذه العملية ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.activeModal.close();
      }
    });
  }
}
