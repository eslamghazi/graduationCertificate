import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxImageCompressService } from 'ngx-image-compress';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SupabaseEditUserService } from 'src/app/shared/supabase-edit-user.service';
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

  subclasses: any = null

  class: any

  NationalId = new FormControl(null, [Validators.required]);
  Name = new FormControl(null, [Validators.required]);
  DateOfBirth = new FormControl(null, [Validators.required]);
  PlaceOfBirth = new FormControl(null, [Validators.required]);
  ClassMonth = new FormControl(0, [Validators.required]);
  Image = new FormControl(null);

  constructor(
    private supabaseEditUserService: SupabaseEditUserService,
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

  async ngOnInit(): Promise<void> {
    this.class = this.activatedRoute.snapshot.paramMap.get('class');

    this.subclasses = await this.supabaseEditUserService.getDataTable("subclasses", { class_id: this.class })
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
      const fileType = file.type; // Get the file type (MIME type)

      if (file.size > 1000000) {
        this.swal.toastr(
          'warning',
          'حجم الصورة اكبر من 1 ميجا، تتم الآن محاولة ضغط حجم الصورة'
        );

        const reader = new FileReader();
        reader.onload = (e: any) => {
          const image = e.target.result;

          if (fileType === 'image/png') {

            this.imageCompress
              .compressFile(image, -1, 50, 50)
              .then((compressedImage) => {
                this.handleCompressedImage(compressedImage, file);
              });
          } else {

            this.imageCompress
              .compressFile(image, -1, 100, 60)
              .then((compressedImage) => {
                this.handleCompressedImage(compressedImage, file);
              });
          }
        };
        reader.readAsDataURL(file);
      } else {

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.defaultImage = e.target.result;
          this.selectedImage = file;
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

  private handleCompressedImage(compressedImage: string, file: File) {
    this.defaultImage = compressedImage;
    const compressedFile = this.dataURLtoFile(compressedImage, file.name);
    this.selectedImage = compressedFile;
    this.spinner.hide();

    if (parseFloat((compressedFile.size / (1024 * 1024)).toFixed(2)) > 1) {
      this.spinner.show();
      this.imageCompress
        .compressFile(compressedImage, -1, 50, 50)
        .then((compressedImage) => {
          this.defaultImage = compressedImage;
          const compressedFile = this.dataURLtoFile(compressedImage, file.name);
          this.selectedImage = compressedFile;
          this.spinner.hide();
        });
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

  async onSubmit() {
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
        const formValues = this.userForm.value;
        const studentData = {
          id: formValues.NationalId,
          name: formValues.Name,
          date_of_birth: formValues.DateOfBirth,
          place_of_birth: formValues.PlaceOfBirth,
          image_url: formValues.Image,
        };

        let imagePromise;
        if (this.selectedImage) {
          const filePath = `${this.class}/${this.ClassMonth.value}/${this.supabaseEditUserService.encryptFileName(studentData.id + "_" + formValues.Name + ".jpg")}`;
          imagePromise = this.supabaseEditUserService.uploadFile(filePath, this.selectedImage);
          this.selectedImage = null
        } else {
          imagePromise = Promise.resolve(studentData.image_url);
        }
        var dataPath = `${this.class}/${this.ClassMonth.value}/${this.NationalId.value}`;
        imagePromise
              .then((imageUrl: any) => {
                studentData.image_url = imageUrl;
                this.supabaseEditUserService.insertImageDetails(studentData, dataPath).then(() => {
                  this.router.navigateByUrl(`/student/editStudentData/${this.class}/${this.ClassMonth.value}/${this.NationalId.value}`);
                  this.spinner.hide();
                });
              })
              .catch(() => {
                this.spinner.hide();
              });
          // if (
          //   !this.selectedImage &&
          //   (this.userForm.dirty || this.selectedDate)
          // ) {
          //   this.supabaseEditUserService.insertImageDetails(studentData, dataPath);
          //   this.spinner.hide();
          // }

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
