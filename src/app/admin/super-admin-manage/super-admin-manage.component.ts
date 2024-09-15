import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-super-admin-manage',
  templateUrl: './super-admin-manage.component.html',
  styleUrls: ['./super-admin-manage.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SuperAdminManageComponent implements OnInit {
  folders: string[] = [];
  groupedFolders: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 1; // Change this based on your preference
  currentPage: number = 1;

  constructor(
    private fireBaseAdminService: FireBaseAdminService,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadFolders();
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

  getIndex(i: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + i + 1;
  }

  deleteFolder(path: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من حذف المجلد ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();
        const folderPath = path; // Replace with your folder path

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
        // const fileName =
        //   path == 'Class2024Intership/June/'
        //     ? 'الصور الخاصة بدور يونيو دفعة 2024'
        //     : path == 'Class2024Intership/September/'
        //     ? 'الصور الخاصة بدور سبتمبر دفعة 2024'
        //     : 'NotYet';

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
}
