import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-upload-excel',
  templateUrl: './upload-excel.component.html',
  styleUrls: ['./upload-excel.component.scss'],
})
export class UploadExcelComponent implements OnInit {
  data: any; // This will store the final structured data
  firebaseData: any;

  flatData: any[] = []; // This will store the flattened data for display in a single table

  model: string = '';

  filteredData: any[] = []; // This will store the filtered data for rendering
  currentPage = 1; // Current page of pagination
  itemsPerPage = 5; // Number of items per page
  searchTerm: string = ''; // Holds the search input

  constructor(
    public activeModal: NgbActiveModal,
    private firebaseAdminService: FireBaseAdminService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) {}

  ngOnInit(): void {}

  // Function to handle file input
  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>event.target;

    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }

    const file: File = target.files[0];

    // Use the service to process the Excel file
    this.firebaseAdminService
      .processExcelFile(file)
      .then((structuredData: any) => {
        this.data = structuredData;
        this.flatData = this.flattenData(this.data); // Flatten the data for rendering in a single table
        this.filteredData = this.flatData; // Flatten the data for rendering in a single table
        console.log(this.flatData); // Display the flattened data
      })
      .catch((error) => {
        console.error('Error processing Excel file:', error);
      });
  }

  // Helper function to flatten the data into a single array with month breaks
  flattenData(structuredData: any): any[] {
    const result: any[] = [];
    const months = Object.keys(structuredData.Class2024Intership);

    months.forEach((month) => {
      // Add a month separator row (can be flagged with `isMonthBreak` for display purposes)
      result.push({ isMonthBreak: true, month: month });

      // Add each entry for the current month
      const nationalIds = Object.keys(structuredData.Class2024Intership[month]);
      nationalIds.forEach((nationalId) => {
        result.push(structuredData.Class2024Intership[month][nationalId]);
      });
    });

    return result;
  }

  confirm() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      this.model == 'upload'
        ? 'هل انت متأكد من رفع هذه البيانات ؟'
        : 'هل انت متأكد من حذف هذه البيانات ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        // Combine June and September (or other months) into Class2024Intership object
        const classData = this.constructClassData(this.data);

        if (this.model == 'upload') {
          // Push the entire Class2024Intership object to Firebase
          this.pushClassDataToFirebase(classData);
        } else {
          // Step 1: Get the existing data from Firebase
          this.firebaseAdminService
            .getAllData('/Class2024Intership', 'object')
            .subscribe((firebaseData: any) => {
              this.firebaseData = firebaseData; // Store the Firebase data locally
              console.log('firebaseDatafirebaseDatafirebaseData', firebaseData);

              // Step 2: Remove matching entries from Firebase
              this.removeMatchingEntries({
                Class2024Intership: this.firebaseData,
              });

              this.pushClassDataToFirebase(this.firebaseData);
            });
        }
      }
    });
    console.log(this.data);
  }

  // Function to check all images and store results
  search() {
    const query = this.searchTerm.toLowerCase(); // Make search case-insensitive
    this.filteredData = this.flatData.filter((entry) => {
      if (entry.isMonthBreak) {
        return true; // Always include the month break rows
      }
      const matchesName = entry.Name.toLowerCase().includes(query);
      const matchesNationalId = entry.NationalId.includes(query);

      return matchesName || matchesNationalId; // Return true if either matches
    });

    this.currentPage = 1; // Reset to the first page after search
  }

  openImage(item: any) {
    window.open(item.Image, '_blank');
  }

  closeModal() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.deleteSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من الغاء هذه العملية ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.activeModal.close();
      }
    });
  }

  // Construct the Class2024Intership object dynamically with all months from structured data
  constructClassData(data: any): any {
    this.spinner.show();
    const cleanedData: any = { Class2024Intership: {} };

    const months = Object.keys(data.Class2024Intership);
    months.forEach((month) => {
      cleanedData.Class2024Intership[month] = {};
      const nationalIds = Object.keys(data.Class2024Intership[month]);
      nationalIds.forEach((nationalId) => {
        const entry = { ...this.data.Class2024Intership[month][nationalId] }; // Copy the entry
        delete entry.id; // Remove the 'id' field
        cleanedData.Class2024Intership[month][nationalId] = entry;
      });
    });
    this.spinner.hide();
    return cleanedData;
  }
  // Function to remove entries from Firebase that match the Excel data by NationalId
  removeMatchingEntries(data: any): void {
    Object.keys(this.data.Class2024Intership || {}).forEach((month) => {
      const excelEntries = this.data.Class2024Intership[month];

      // Loop through the Excel data for this month
      Object.keys(excelEntries || {}).forEach((nationalId) => {
        // Check if the NationalId exists in the Firebase data for the same month
        if (
          data.Class2024Intership[month] &&
          data.Class2024Intership[month][nationalId]
        ) {
          // Remove the matching entry from Firebase data
          delete data.Class2024Intership[month][nationalId];
          console.log(`Removed NationalId ${nationalId} from month ${month}`);
        }
      });
    });
  }
  // Function to push the entire Class2024Intership object to Firebase
  pushClassDataToFirebase(classData: any): void {
    console.log('classDataclassData', classData);

    this.spinner.show();
    this.firebaseAdminService
      .pushClassData(classData)
      .then(() => {
        this.spinner.hide();
        this.model == 'upload'
          ? this.swal.toastr('success', 'تم رفع البيانات بنجاح')
          : this.swal.toastr('success', 'تم حذف البيانات بنجاح');
        this.activeModal.close();
      })
      .catch((error) => {
        this.spinner.hide();
        this.model == 'upload'
          ? this.swal.toastr('error', 'خطأ في رفع البيانات')
          : this.swal.toastr('error', 'خطأ في حذف البيانات');
      });
  }
}
