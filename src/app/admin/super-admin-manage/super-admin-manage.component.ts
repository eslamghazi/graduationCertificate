import { Router } from '@angular/router';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';
import { UploadExcelComponent } from '../upload-excel/upload-excel.component';

@Component({
  selector: 'app-super-admin-manage',
  templateUrl: './super-admin-manage.component.html',
  styleUrls: ['./super-admin-manage.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminManageComponent implements OnInit {
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

  constructor(
    private fireBaseAdminService: FireBaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private route: Router
  ) { }

  ngOnInit() {
    this.loadFolders();
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

    this.fireBaseAdminService
      .getAllData(`/${this.currentClass}`, 'object')
      .subscribe((result) => {
        this.foldersRealDatabase = this.flattenFolderStructure(result);
        console.log(result);
        console.log(this.foldersRealDatabase);
        this.spinner.hide();
      });
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
        this.route.navigateByUrl(
          `/student/editStudentData/${this.currentClass}/${ClassMonth}/${id}`
        );
      }
    });
  }

  // A method that flattens your folders and national IDs into a single list
  getFlattenedData() {
    const flattenedData: any = [];

    this.filteredFoldersRealtimeDatabase().forEach((folder, folderIndex) => {
      // Push folder as the main row
      flattenedData.push({
        isFolder: true,
        folderIndex: folderIndex,
        folderName: folder.folderName,
        nationalIds: folder.nationalIds,
      });

      // Push each national ID as a separate row under the folder and reset numbering
      let subIndex = 1; // Reset subIndex to 1 for each folder
      folder.nationalIds.forEach((id: any, index: any) => {
        flattenedData.push({
          isFolder: false,
          folderIndex: folderIndex,
          idIndex: subIndex++, // Increment subIndex for each ID, reset to 1 at the start of each folder
          id: id,
          subFolderData: folder.subFolderData[id],
        });
      });
    });

    return flattenedData;
  }

  // Flatten the folder structure to handle root and subfolders
  flattenFolderStructure(data: any): any[] {
    const folderArray = [];
    this.studentsNumber = 0;
    for (const folder in data) {
      const subFolderData = data[folder];
      const nationalIds = Object.keys(subFolderData);
      folderArray.push({
        folderName: folder, // E.g., 'June', 'September'
        subFolderData, // Contains the objects inside
        nationalIds, // National IDs of the objects in the folder
      });
      this.studentsNumber += nationalIds.length;
    }

    return folderArray;
  }

  // Search logic (optional)
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
    this.folders = await this.fireBaseAdminService.listAllFolders();
    this.groupFoldersByParent();
    this.spinner.hide();
  }
  getFolderName(folderPath: string): string {
    const pathParts = folderPath.split('/');
    return pathParts[pathParts.length - 1];
  }

  groupFoldersByParent() {
    this.spinner.show();
    // Group folders by their first segment (parent folder)
    const folderMap: any = new Map<string, string[]>();

    this.folders.forEach((folder) => {
      const segments = folder.split('/');
      const rootFolder = segments[0]; // first segment is the root folder

      if (!folderMap.has(rootFolder)) {
        folderMap.set(rootFolder, []);
      }

      folderMap.get(rootFolder).push(folder);
    });

    // Convert map to an array for easier use in template
    this.groupedFolders = Array.from(folderMap.entries()).map(
      ([parentFolder, subFolders]: any) => {
        return { parentFolder, subFolders };
      }
    );
    this.spinner.hide();
  }

  filteredFolders(): any[] {
    const filtered = this.groupedFolders.filter((group) => {
      // Check if the parent folder or any of its subfolders match the search term
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

    // Passing data to the modal
    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message =
      comingFrom == 'realtimeDatabase'
        ? 'هل انت متأكد من حذف البيانات ؟'
        : 'هل انت متأكد من حذف المجلد ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const folderPath = path; // Replace with your folder path
        if (comingFrom == 'realtimeDatabase') {
          this.fireBaseAdminService
            .removeImagePropertyFromDatabase(path, 'deleteAll')
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
        this.fireBaseAdminService.deleteFolder(folderPath).subscribe({
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
      }
    });
  }

  downloadFileNames(path: any, fileName: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من تحميل ملف نصي به اسماء جميع الملفات / المجلدات الموجوده بالمجلد ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.swal.toastr(
          'warning',
          'جار تجهيز قائمة بأسماء الملفات الموجوده داخل المجلد'
        );
        this.spinner.show();
        const folderPath = path; // Replace with your folder path

        this.fireBaseAdminService.getFileNames(folderPath).subscribe({
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

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من ضغط جميع الصور الموجودة بالمجلد ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();

        this.fireBaseAdminService
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

    // Passing data to the modal
    modalRef.componentInstance.model = model;

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        modalRef.componentInstance.model = null;
      }
    });
  }

  downloadDefaultExcel() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل تريد تحميل شيت الرفع (excel) الافتراضي؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', 'مسودة لشيت الرفع.xlsx');
        downloadLink.href = 'assets/Graduation-Certificate-Sample.xlsx';
        document.body.appendChild(downloadLink); // Append the link to the DOM
        downloadLink.click(); // Programmatically trigger the click
        document.body.removeChild(downloadLink); // Remove link after download

        this.activeModal.dismiss();
      }
    });
  }
}
