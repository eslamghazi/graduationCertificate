import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxImageCompressService } from 'ngx-image-compress';
import { NgxSpinnerService } from 'ngx-spinner';
import { FireBaseEditUserService } from 'src/app/shared/fire-base-edit-user.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-add-student-data',
  templateUrl: './add-student-data.component.html',
  styleUrls: ['./add-student-data.component.scss'],
})
export class AddStudentDataComponent implements OnInit {
  currentCLass = localStorage.getItem('currentClass');
  defaultImage = 'assets/Images/DefaultImage.jpg';
  selectedImage: any = null;
  selectedDate: any = null;

  class: any

  NationalId = new FormControl(null, [Validators.required]);
  Name = new FormControl(null, [Validators.required]);
  DateOfBirth = new FormControl(null, [Validators.required]);
  PlaceOfBirth = new FormControl(null, [Validators.required]);
  ClassMonth = new FormControl(0, [Validators.required]);
  Image = new FormControl(null);

  constructor(
    private fireBaseEditService: FireBaseEditUserService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router,
    private swal: SwalService,
    private imageCompress: NgxImageCompressService
  ) { }

  userForm = new FormGroup({
    NationalId: this.NationalId,
    Name: this.Name,
    DateOfBirth: this.DateOfBirth,
    PlaceOfBirth: this.PlaceOfBirth,
    ClassMonth: this.ClassMonth,
    Image: this.Image,
  });

  ngOnInit(): void {
    this.class = this.activatedRoute.snapshot.paramMap.get('class');
  }

  onChangeDate(event: any) {
    this.spinner.show();
    this.selectedDate = `${event.year}-${event.month}-${event.day}`;

    this.DateOfBirth.patchValue(this.selectedDate);
    this.spinner.hide();
  }

  onFileChange(event: any) {
    this.spinner.show();
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 1000000) {
        this.swal.toastr(
          'warning',
          'حجم الصورة اكبر من 1 ميجا، تتم الآن محاولة ضغط حجم الصورة'
        );

        // If file size is more than 1.5MB, compress it
        const reader = new FileReader();

        reader.onload = (e: any) => {
          const image = e.target.result;
          // Compress the image using ngx-image-compress
          this.imageCompress
            .compressFile(image, -1, 100, 60)
            .then((compressedImage) => {
              // Set the compressed image as the default image
              this.defaultImage = compressedImage;

              // Convert the compressed base64 image back to a file (optional)
              const compressedFile = this.dataURLtoFile(
                compressedImage,
                file.name
              );
              console.log(
                'compressedFile',
                (compressedFile.size / (1024 * 1024)).toFixed(2)
              );
              // Assign the compressed file to selectedImage
              this.selectedImage = compressedFile;
              this.spinner.hide();
              if (
                parseFloat((compressedFile.size / (1024 * 1024)).toFixed(2)) > 1
              ) {
                this.spinner.show();

                this.imageCompress
                  .compressFile(image, -1, 50, 50)
                  .then((compressedImage) => {
                    // Set the compressed image as the default image
                    this.defaultImage = compressedImage;

                    // Convert the compressed base64 image back to a file (optional)
                    const compressedFile = this.dataURLtoFile(
                      compressedImage,
                      file.name
                    );
                    console.log(
                      'compressedFile',
                      (compressedFile.size / (1024 * 1024)).toFixed(2)
                    );
                    // Assign the compressed file to selectedImage
                    this.selectedImage = compressedFile;

                    // Hide the spinner
                    this.spinner.hide();
                  });
              }
            });
        };

        // Read the original image as base64 data URL
        reader.readAsDataURL(file);
      } else {
        // If file size is less than 1MB, do not compress
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.defaultImage = e.target.result; // Set the original image
          this.selectedImage = file; // Use the original file without compression
        };
        reader.readAsDataURL(file);

        this.spinner.hide();
      }
    } else {
      this.defaultImage = 'assets/Images/DefaultImage.jpg';
      this.selectedImage = null;
      this.spinner.hide();
    }
  }

  // Helper function to convert base64 data URL back to a file
  dataURLtoFile(dataurl: string, filename: string) {
    this.spinner.show();
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'unknown'; // Provide a default value if no match is found
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    var aa = new File([u8arr], filename, { type: mime });
    this.spinner.hide();
    return new File([u8arr], filename, { type: mime });
  }

  async onSubmit(formValues: any) {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message = 'هل انت متأكد من اضافة البيانات ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.spinner.show();

        const ClassMonth =
          (this.ClassMonth.value as any) == '1'
            ? 'June'
            : (this.ClassMonth.value as any) == '2'
              ? 'September'
              : null;

        var filePath = `${this.class}/${ClassMonth}/${this.NationalId.value}.jpg`;
        var dataPath = `${this.class}/${ClassMonth}/${this.NationalId.value}`;

        if (this.selectedImage) {
          this.fireBaseEditService.uploadToStorage(
            filePath,
            this.selectedImage,
            {
              ...formValues,
              ClassMonth: ClassMonth,
            }
          );
          return;
        } else {
          if (
            !this.selectedImage &&
            (this.userForm.dirty || this.selectedDate)
          ) {
            this.fireBaseEditService.insertImageDetails(
              { ...formValues, ClassMonth: ClassMonth },
              dataPath
            );
          }
        }
      }
    });
  }

  goBack() {
    const modalRef = this.modalService.open(SharedModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    // Passing data to the modal
    modalRef.componentInstance.warningSvg = true;
    modalRef.componentInstance.message =
      'هل انت متأكد من العودة للصفحة السابقة ؟';

    // Handle modal result
    modalRef.result.then((result) => {
      if (result) {
        this.router.navigateByUrl('/admin/getAllStudentsData');
      }
    });
  }

  typingId(event: any) {
    if (event.value) {
      if (!(event.value.length == 14)) {
        this.NationalId.setErrors({ pattern: true });
      }
    }
  }
}
