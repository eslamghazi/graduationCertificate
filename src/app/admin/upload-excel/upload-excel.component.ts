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

  flatData: any; // This will store the flattened data for display in a single table

  model: string = 'upload';

  filteredData: any; // This will store the filtered data for rendering
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

  ngOnInit(): void {
    console.log(this.model);
    this.data = null;
    this.firebaseData = null;
    this.flatData = null;
    this.filteredData = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.searchTerm = '';
  }

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
    const months = Object.keys(structuredData.Class2024Internship);

    months.forEach((month) => {
      // Add a month separator row (can be flagged with `isMonthBreak` for display purposes)
      result.push({ isMonthBreak: true, month: month });

      // Add each entry for the current month
      const nationalIds = Object.keys(
        structuredData.Class2024Internship[month]
      );
      nationalIds.forEach((nationalId) => {
        result.push(structuredData.Class2024Internship[month][nationalId]);
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
        const subscription = this.firebaseAdminService
          .getAllData('/Class2024Internship', 'object')
          .subscribe(async (firebaseData: any) => {
            if (firebaseData) {
              if (this.model == 'upload') {
                this.firebaseData = {
                  Class2024Internship: firebaseData,
                };
                this.data = this.mergeData(this.firebaseData, this.data);

                const classData = this.constructClassData(this.data);

                await this.pushClassDataToFirebase(classData);
              } else {
                this.firebaseData = firebaseData;
                this.removeMatchingEntries({
                  Class2024Internship: this.firebaseData,
                });

                await this.pushClassDataToFirebase(this.firebaseData);
              }

              // Unsubscribe after the first execution
              subscription.unsubscribe();
            } else {
              const classData = this.constructClassData(this.data);

              await this.pushClassDataToFirebase(classData);
            }
          });
      }
    });
  }

  mergeData(obj1: any, obj2: any): any {
    const mergedResult: any = {
      Class2024Internship: {},
    };

    // Helper function to merge two months
    function mergeMonthData(monthData1: any, monthData2: any): any {
      const mergedMonth: any = { ...monthData1 }; // Start with data from obj1

      // Merge data from obj2
      for (const nationalId in monthData2) {
        // If a NationalId exists in both, obj2's data will override
        mergedMonth[nationalId] = { ...monthData2[nationalId] };
      }

      return mergedMonth;
    }

    // Iterate over the months in obj1
    for (const month in obj1.Class2024Internship) {
      // If the month exists in both obj1 and obj2, merge them
      if (obj2.Class2024Internship[month]) {
        mergedResult.Class2024Internship[month] = mergeMonthData(
          obj1.Class2024Internship[month],
          obj2.Class2024Internship[month]
        );
      } else {
        // If the month only exists in obj1, copy it
        mergedResult.Class2024Internship[month] = {
          ...obj1.Class2024Internship[month],
        };
      }
    }

    // Iterate over the months in obj2 that are not in obj1 and add them
    for (const month in obj2.Class2024Internship) {
      if (!mergedResult.Class2024Internship[month]) {
        mergedResult.Class2024Internship[month] = {
          ...obj2.Class2024Internship[month],
        };
      }
    }

    return mergedResult;
  }

  // Function to check all images and store results
  search() {
    const query = this.searchTerm.toLowerCase(); // Make search case-insensitive
    this.filteredData = this.flatData.filter((entry: any) => {
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

  // Construct the Class2024Internship object dynamically with all months from structured data
  constructClassData(data: any): any {
    this.spinner.show();
    const cleanedData: any = { Class2024Internship: {} };

    const months = Object.keys(data.Class2024Internship);
    months.forEach((month) => {
      cleanedData.Class2024Internship[month] = {};
      const nationalIds = Object.keys(data.Class2024Internship[month]);
      nationalIds.forEach((nationalId) => {
        const entry = { ...this.data.Class2024Internship[month][nationalId] }; // Copy the entry
        delete entry.id; // Remove the 'id' field
        cleanedData.Class2024Internship[month][nationalId] = entry;
      });
    });

    this.spinner.hide();
    return cleanedData;
  }
  // Function to remove entries from Firebase that match the Excel data by NationalId
  removeMatchingEntries(data: any): void {
    Object.keys(this.data.Class2024Internship || {}).forEach((month) => {
      const excelEntries = this.data.Class2024Internship[month];
      // Loop through the Excel data for this month
      Object.keys(excelEntries || {}).forEach((nationalId) => {
        // Check if the NationalId exists in the Firebase data for the same month
        if (
          data.Class2024Internship[month] &&
          data.Class2024Internship[month][nationalId]
        ) {
          // Remove the matching entry from Firebase data
          delete data.Class2024Internship[month][nationalId];
          console.log(`Removed NationalId ${nationalId} from month ${month}`);
        }
      });
    });
  }

  restructureData(originalData: any) {
    // Check if the input data has the 'Class2024Internship' wrapper
    if (originalData.Class2024Internship) {
      // Extract and return the nested data directly
      return originalData.Class2024Internship;
    } else {
      // Return the input if the structure is already correct
      return originalData;
    }
  }

  // Function to push the entire Class2024Internship object to Firebase
  async pushClassDataToFirebase(classData: any): Promise<void> {
    this.spinner.show();
    const restructuredData = this.restructureData(classData);

    await this.firebaseAdminService
      .pushClassData(restructuredData, '/Class2024Internship')
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
