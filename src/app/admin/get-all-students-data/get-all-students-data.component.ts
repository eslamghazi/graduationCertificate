import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FireBaseAdminService } from 'src/app/shared/fire-base-admin.service';
import * as XLSX from 'xlsx'; // Import the xlsx library
import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-get-all-students-data',
  templateUrl: './get-all-students-data.component.html',
  styleUrls: ['./get-all-students-data.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disable encapsulation
})
export class GetAllStudentsDataComponent implements OnInit {
  data = [
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام عصام عبدالوهاب',
      NationalId: '3011028150753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '1998-8-28',
      Name: 'ايمن جمال',
      NationalId: '30101284200753',
      PlaceOfBirth: 'كفرالشيخ',
    },
    {
      ClassMonth: 'June',
      DateOfBirth: '2024-9-26',
      Image:
        'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      Name: 'اسلام جمال عبدالوهاب',
      NationalId: '30110281500753',
      PlaceOfBirth: 'كفرالشيخ',
    },
  ];

  // data: any[] = [];
  filteredData: any[] = [];

  searchTerm: string = ''; // Holds the search input
  selectClass = new FormControl(0);
  selectUserType = new FormControl(0);

  currentPage = 1; // Current page of pagination
  itemsPerPage = 5; // Number of items per page

  files = [
    {
      url: 'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      name: 'file1.jpg',
    },
    {
      url: 'https://firebasestorage.googleapis.com/v0/b/graduationcertificate.appspot.com/o/Class2024Intership%2FJune%2F30110281500753.jpg?alt=media&token=0cc67690-9514-41fb-9ba1-99a4c0a03e72',
      name: 'file2.jpg',
    },
  ];

  constructor(
    private fireBaseAdminService: FireBaseAdminService,
    private http: HttpClient,
    private storage: AngularFireStorage
  ) {}

  adminForm = new FormGroup({
    selectClass: this.selectClass,
    selectUserType: this.selectUserType,
  });

  ngOnInit() {}

  selectClassFunc() {
    this.selectUserType.patchValue(0);
    const path =
      this.selectClass.value == 1
        ? 'Class2024Intership/June/'
        : this.selectClass.value == 2
        ? 'Class2024Intership/September/'
        : 'NotYet';

    // this.fireBaseAdminService.getAllData(path).subscribe((result) => {
    //   this.data = result;

    //   // Check for each NationalId if a file exists in Firebase Storage
    //   console.log(this.data);
    // });
  }

  selectUserTypeFunc() {
    if (this.selectUserType.value == 1) {
      this.filterDataWithImages();
    } else if (this.selectUserType.value == 2) {
      this.filterDataWithOutImages();
    }
  }

  // Function to filter data based on the presence of the Image property
  filterDataWithImages() {
    this.filteredData = this.data.filter((item) => item.Image); // Only include items with the Image property
    console.log('filteredData Array:', this.filteredData); // Log the filtered array
    this.currentPage = 1;
  }

  // Function to filter data based on the presence of the Image property
  filterDataWithOutImages() {
    this.filteredData = this.data.filter((item) => !item.Image); // Only include items with the Image property
    console.log('filteredData Array:', this.filteredData); // Log the filtered array
    this.currentPage = 1;
  }

  // Filter data based on search input
  search() {
    if (this.searchTerm) {
      // Perform search on the original dataArray to always start with the full dataset
      this.filteredData = this.data.filter(
        (item) =>
          (item.Name &&
            item.Name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          (item.NationalId && item.NationalId.includes(this.searchTerm))
      );
    } else {
      // If search term is empty, reset to show all data with Image property
      this.selectUserType.value == 1
        ? this.filterDataWithImages()
        : this.selectUserType.value == 2
        ? this.filterDataWithOutImages()
        : null;
    }
    this.currentPage = 1; // Reset to the first page after search
  }

  // Export data to Excel with custom column order and index
  exportToExcel(): void {
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
      `${
        this.selectClass.value == 1
          ? 'بيانات الطلاب الذين قاموا بوضع صورهم.xlsx'
          : this.selectClass.value == 2
          ? 'بيانات الطلاب الذين لم يقوموا بوضع صورهم.xlsx'
          : null
      }`
    );
  }

  openImage(item: any) {
    window.open(item.Image, '_blank');
  }

  getIndex(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }

  // Function to download files and create a zip archive
  // async downloadAndZipFiles() {
  //   const zip = new JSZip();
  //   const filePromises = this.files.map((file) =>
  //     this.http
  //       .get(file.url, { responseType: 'blob' })
  //       .toPromise()
  //       .then((blob) => {
  //         if (blob) {
  //           zip.file(file.name, blob);
  //         }
  //       })
  //       .catch((error) => {
  //         console.error('Error downloading file:', file.url, error.message);
  //       })
  //   );

  //   Promise.all(filePromises)
  //     .then(() => {
  //       zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
  //         saveAs(content, 'files.zip');
  //       });
  //     })
  //     .catch((error) => {
  //       console.error('Error creating zip archive:', error);
  //     });
  // }

  exportAllPhotos() {
    // this.downloadAndZipFiles();
  }
}
