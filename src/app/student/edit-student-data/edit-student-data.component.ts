import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxImageCompressService } from 'ngx-image-compress';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupabaseEditUserService } from 'src/app/shared/supabase-edit-user.service';
import { SharedModalComponent } from 'src/app/shared/shared-modal/shared-modal.component';
import { SwalService } from 'src/app/shared/swal.service';

@Component({
  selector: 'app-edit-student-data',
  templateUrl: './edit-student-data.component.html',
  styleUrls: ['./edit-student-data.component.scss'],
})
export class EditStudentDataComponent implements OnInit {
  authCheck = localStorage.getItem('adminCheck');
  defaultImage = 'assets/Images/DefaultImage.jpg';
  selectedImage: any = null;
  selectedDate: any = null;

  id: any;
  class: any;
  subClass: any;

  data: any;

  NationalId = new FormControl(null, [Validators.required]);
  Name = new FormControl(null, [Validators.required]);
  name_en = new FormControl(null);
  DateOfBirth = new FormControl(null, [Validators.required]);
  PlaceOfBirth = new FormControl(null, [Validators.required]);
  Image = new FormControl(null);

  subClasses: any[] = [];
  Classes: any[] = [];
  Class = new FormControl(null, [Validators.required]);
  ClassMonth = new FormControl(null, [Validators.required]);
  is_mozaola = new FormControl(0, [Validators.required, Validators.min(0)]);

  constructor(
    private supabaseEditService: SupabaseEditUserService,
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
    name_en: this.name_en,
    DateOfBirth: this.DateOfBirth,
    PlaceOfBirth: this.PlaceOfBirth,
    Image: this.Image,
    Class: this.Class,
    ClassMonth: this.ClassMonth,
    is_mozaola: this.is_mozaola,
  });

  async ngOnInit(): Promise<void> {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');

    if (this.id) {
      this.getClasses();
      this.searchData(this.id);
    }
  }

  getClasses() {
    this.spinner.show();
    this.supabaseEditService
      .getDataTable('classes')
      .then((data: any) => {
        this.Classes = data.map((item: any) => ({
          key: item.id,
          value: item
        }));
        this.spinner.hide();
      });
  }

  async changeClass() {
    this.spinner.show();
    this.class = this.Class.value;
    if (this.class) {
      this.subClasses = await this.supabaseEditService.getDataTable('subclasses', { class_id: this.class });
      // Reset subclass when class changes
      this.ClassMonth.patchValue(this.subClasses.length > 0 ? this.subClasses[0].id : null);
    } else {
      this.subClasses = [];
      this.ClassMonth.patchValue(null);
    }
    this.spinner.hide();
  }

  async searchData(id: any) {
    this.spinner.show();
    this.supabaseEditService
      .getDataById(id)
      .subscribe(async (data) => {
        if (data) {
          this.data = data;
          this.class = data.class_id;
          this.subClass = data.subclass_id;
          
          if (this.class) {
            this.subClasses = await this.supabaseEditService.getDataTable('subclasses', { class_id: this.class });
          }
          
          this.patchValues();
          this.spinner.hide();
        }
      });
  }

  async patchValues() {
    this.spinner.show();
    this.NationalId.patchValue(this.data.id);
    this.Name.patchValue(this.data.name);
    this.name_en.patchValue(this.data.name_en);
    this.DateOfBirth.patchValue(this.data.date_of_birth);
    this.PlaceOfBirth.patchValue(this.data.place_of_birth);
    this.Image.patchValue(this.data.image_url);
    this.Class.patchValue(this.data.class_id);
    this.ClassMonth.patchValue(this.data.subclass_id);
    this.is_mozaola.patchValue(this.data.is_mozaola || 0);

    let isImageValid = await this.supabaseEditService
    .checkImageExists(this.data.image_url)
    if (isImageValid) {
      this.defaultImage = this.data.image_url
      ? this.data.image_url
      : 'assets/Images/DefaultImage.jpg';
    } else {
      this.defaultImage = 'assets/Images/DefaultImage.jpg'
    }
    this.spinner.hide();
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


  dataURLtoFile(dataurl: string, filename: string) {
    this.spinner.show();
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'unknown';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], filename, { type: mime });
    this.spinner.hide();
    return file;
  }

  async onSubmit() {
    this.spinner.show();
    let isImageValid = await this.supabaseEditService
    .checkImageUrl(this.data.image_url)
    .toPromise();
  this.spinner.hide();

        if (
          (!this.selectedImage && !this.data.image_url) ||
          (this.data.image_url && !isImageValid && !this.selectedImage)
        ) {
          this.swal.toastr('error', 'الرجاء رفع صورة اخري ثم حاول مرة اخري');
          this.spinner.hide();
          return;
        }

        const modalRef = this.modalService.open(SharedModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
        });

        modalRef.componentInstance.warningSvg = true;
        modalRef.componentInstance.message = 'هل انت متأكد من تعديل البيانات ؟';

        modalRef.result.then((result) => {
          if (result) {
            this.spinner.show();
            const formValues = this.userForm.value;
            const studentData = {
              ...this.data,
              id: formValues.NationalId,
              name: formValues.Name,
              name_en: formValues.name_en,
              date_of_birth: formValues.DateOfBirth,
              place_of_birth: formValues.PlaceOfBirth,
              image_url: formValues.Image,
              class_id: formValues.Class,
              subclass_id: formValues.ClassMonth,
              is_mozaola: formValues.is_mozaola,
            };
            let imagePromise;
            if (this.selectedImage) {
              const filePath = `${formValues.Class}/${formValues.ClassMonth}/${this.supabaseEditService.encryptFileName(formValues.NationalId + "_" + formValues.Name + ".jpg")}`;
              imagePromise = this.supabaseEditService.uploadFile(filePath, this.selectedImage);
              this.selectedImage = null
            } else if ((this.data.subclass_id !== formValues.ClassMonth || this.data.class_id !== formValues.Class) && this.data.image_url) {
              // Move image if subclass or class changed and no new image uploaded
              const oldPath = `${this.data.class_id}/${this.data.subclass_id}/${this.data.image_url.split('/').pop().split('?')[0]}`;
              const newPath = `${formValues.Class}/${formValues.ClassMonth}/${this.data.image_url.split('/').pop().split('?')[0]}`;
              imagePromise = this.supabaseEditService.moveFile(oldPath, newPath);
            } else {
              imagePromise = Promise.resolve(studentData.image_url);
            }
            imagePromise
              .then((imageUrl) => {
                studentData.image_url = imageUrl;
                this.supabaseEditService.insertImageDetails(studentData, `${formValues.Class}/${formValues.ClassMonth}/${formValues.NationalId}`).then(() => {
                  
                  // Also delete the old record if the path changed
                  if (this.data.class_id !== formValues.Class || this.data.subclass_id !== formValues.ClassMonth) {
                     this.supabaseEditService.deleteOldRecord(`${this.data.class_id}/${this.data.subclass_id}/${this.data.id}`);
                  }
                  
                  this.spinner.hide();
                });
              })
              .catch(() => {
                this.spinner.hide();
              });
          }
        });

  }

  goBack() {
    if (this.selectedImage || this.userForm.dirty || this.selectedDate) {
      const modalRef = this.modalService.open(SharedModalComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });

      modalRef.componentInstance.warningSvg = true;
      modalRef.componentInstance.message = 'هل انت متأكد من العودة للصفحة السابقة ؟';

      modalRef.result.then((result) => {
        if (result) {
          this.router.navigateByUrl('/student/getStudentData');
        }
      });
    } else {
      this.router.navigateByUrl('/student/getStudentData');
    }
  }
}
