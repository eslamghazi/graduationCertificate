import { Router } from '@angular/router';
import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupabaseAdminService } from 'src/app/shared/supabase-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';
import { UploadExcelComponent } from '../upload-excel/upload-excel.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-super-admin-manage',
  templateUrl: './super-admin-manage.component.html',
  styleUrls: ['./super-admin-manage.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminManageComponent implements OnInit, OnDestroy {
  currentClass = localStorage.getItem('currentClass');

  superAdminCheck =
    localStorage.getItem('adminCheck')?.split('-')[0] == 'superadmin';

  active = 1;

  foldersRealDatabase: any[] = [];
  studentsNumber: any;

  folders: any[] = [];
  groupedFolders: any[] = [];

  searchTerm: string = '';
  itemsPerPage: any = 1;
  currentPage: number = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private supabaseAdminService: SupabaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private route: Router
  ) {}

  ngOnInit() {
    this.loadFolders();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onTabChange(event: any) {
    if (event.nextId == 1) {
      this.active = 1;
      this.loadFolders();
      this.currentPage = 1;
      this.itemsPerPage = 1;
    } else if (event.nextId == 2) {
      this.active = 2;
      this.getFoldersFromRealtimeDatabase();
      this.currentPage = 1;
      this.itemsPerPage = 5;
    } else {
      this.active = 3;
    }
  }

  getFoldersFromRealtimeDatabase() {
    this.spinner.show();

    const sub = this.supabaseAdminService
      .getAllData('students', { class_id: this.currentClass })
      .subscribe((result) => {
        this.foldersRealDatabase = this.flattenFolderStructure(result);
        this.spinner.hide();
      });
    this.subscriptions.push(sub);
  }

  goEdit(ClassMonth: any, id: any) {

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
        this.route.navigateByUrl(
          `/student/editStudentData/${this.currentClass}/${ClassMonth}/${id}`
        );
      }
    });
  }

  getFlattenedData() {
    const flattenedData: any = [];

    this.filteredFoldersRealtimeDatabase().forEach((folder, folderIndex) => {
      flattenedData.push({
        isFolder: true,
        folderIndex: folderIndex,
        folderName: folder.folderName,
        nationalIds: folder.nationalIds,
      });

      let subIndex = 1;
      folder.nationalIds.forEach((id: any, index: any) => {
        flattenedData.push({
          isFolder: false,
          folderIndex: folderIndex,
          idIndex: subIndex++,
          id: id,
          subFolderData: folder.subFolderData[id],
        });
      });
    });

    return flattenedData;
  }

  flattenFolderStructure(data: any[]): any[] {
    const folderMap: { [key: string]: any } = {};
    this.studentsNumber = 0;
    data.forEach((student) => {
      const folderName = student.subclass_id.split('-').pop();
      if (!folderMap[folderName]) {
        folderMap[folderName] = {
          folderName,
          subFolderData: {},
          nationalIds: [],
        };
      }
      folderMap[folderName].subFolderData[student.id] = student;
      folderMap[folderName].nationalIds.push(student.id);
      this.studentsNumber++;
    });

    return Object.values(folderMap);
  }

  filteredFoldersRealtimeDatabase() {
    return this.foldersRealDatabase.filter(
      (folder) =>
        folder.folderName
          .toString()
          .toLowerCase()
          .includes(this.searchTerm.toString().toLowerCase()) ||
        folder.nationalIds.some((id: any) =>
          id.includes(this.searchTerm.toString().toLowerCase())
        )
    );
  }

  getIndex(index: number) {
    return index + 1 + (this.currentPage - 1) * this.itemsPerPage;
  }

  async loadFolders() {
    this.spinner.show();
    try {
      this.folders = await this.supabaseAdminService.listAllFolders();
      this.groupFoldersByParent();
    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ أثناء تحميل المجلدات');
    } finally {
      this.spinner.hide();
    }
  }

  getFolderName(folderPath: string): string {
    const pathParts = folderPath.split('/');
    return pathParts[pathParts.length - 1];
  }

  groupFoldersByParent() {
    this.spinner.show();
    const folderMap: any = new Map<string, string[]>();

    this.folders.forEach((folder) => {
      const segments = folder.split('/');
      const rootFolder = segments[0];

      if (!folderMap.has(rootFolder)) {
        folderMap.set(rootFolder, []);
      }

      folderMap.get(rootFolder).push(folder);
    });

    this.groupedFolders = Array.from(folderMap.entries()).map(
      ([parentFolder, subFolders]: any) => {
        return { parentFolder, subFolders };
      }
    );
    this.spinner.hide();
  }

  filteredFolders(): any[] {
    const filtered = this.groupedFolders.filter((group) => {
      return (
        group.parentFolder
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        group.subFolders.some((subFolder: string) =>
          subFolder.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    });

    return filtered;
  }

  deleteFolder(path: any, comingFrom?: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message =
      comingFrom == 'realtimeDatabase'
        ? 'هل انت متأكد من حذف البيانات ؟'
        : 'هل انت متأكد من حذف المجلد ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const folderPath = path;

        if (comingFrom == 'realtimeDatabase') {

          this.supabaseAdminService
            .removeImagePropertyFromDatabase(folderPath, 'deleteAll') // Use the correct method
            .then(() => {
              this.spinner.hide();
              this.swal.toastr('success', 'تم حذف البيانات بنجاح');
              this.getFoldersFromRealtimeDatabase();
            })
            .catch((error) => {
              this.spinner.hide();
              this.swal.toastr('error', 'عفوًا حدث خطأ أثناء حذف البيانات');
              this.getFoldersFromRealtimeDatabase();
            });
          return;
        }

        const sub = this.supabaseAdminService.deleteFolder(folderPath).subscribe({
          next: () => {
            this.spinner.hide();
            this.swal.toastr('success', 'تم حذف المجلد بنجاح');
            this.loadFolders();
          },
          error: (error) => {
            this.spinner.hide();
            this.swal.toastr('error', 'عفوًا حدث خطأ أثناء حذف المجلد');
            this.loadFolders();
          },
        });
        this.subscriptions.push(sub);
      }
    });
  }

  downloadFileNames(path: any, fileName: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تحميل ملف نصي به اسماء جميع الملفات / المجلدات الموجوده بالمجلد ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.swal.toastr(
          'warning',
          'جار تجهيز قائمة بأسماء الملفات الموجوده داخل المجلد'
        );
        this.spinner.show();

        const folderPath = path;
        const sub = this.supabaseAdminService.getFileNames(folderPath).subscribe({
          next: (fileNames) => {
            this.downloadTxtFile(fileNames, fileName);
            this.spinner.hide();
            this.swal.toastr('success', 'تم تجهيز الملف بنجاح');
          },
          error: (error) => {
            this.swal.toastr(
              'error',
              'عفوًا حدث خطأ أثناء تحميل قائمة الملفات'
            );
            this.spinner.hide();
          },
        });
        this.subscriptions.push(sub);
      }
    });
  }

  downloadTxtFile(fileNames: string[], fileName: string) {
    const blob = new Blob([fileNames.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportAllPhotos(path: any, fileName: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من ضغط جميع الصور الموجودة بالمجلد ؟';

    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();

        this.supabaseAdminService
          .downloadFolderAsZip(path, fileName)
          .then(() => {
            this.swal.toastr('success', 'تم تحضير الصور بنجاح');
            this.spinner.hide();
          })
          .catch((err) => {
            this.swal.toastr('error', 'حدث خطأ اثناء تحضير الصور');
            this.spinner.hide();
          });
      }
    });
  }

  uploadExcel(model: string) {
    const modalRef = this.modalService.open(UploadExcelComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.model = model;

    modalRef.result.then((result) => {
      if (result) {
        modalRef.componentInstance.model = null;
        this.getFoldersFromRealtimeDatabase();
      }
    });
  }

  downloadDefaultExcel() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل تريد تحميل شيت الرفع (excel) الافتراضي؟';

    modalRef.result.then((result) => {
      if (result) {
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', 'مسودة لشيت الرفع.xlsx');
        downloadLink.href = 'assets/Graduation-Certificate-Sample.xlsx';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        this.activeModal.dismiss();
      }
    });
  }
}
