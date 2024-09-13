import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FireBaseEditUserService } from 'src/app/shared/fire-base-edit-user.service';

@Component({
  selector: 'app-edit-user-data',
  templateUrl: './edit-user-data.component.html',
  styleUrls: ['./edit-user-data.component.scss'],
})
export class EditUserDataComponent implements OnInit {
  defaultImage = 'assets/Images/DefaultImage.jpg';
  selectedImage: any = null;
  selectedDate: any = null;

  id: any;
  class: any;

  data: any;

  NationalId = new FormControl(null, [Validators.required]);
  Name = new FormControl(null, [Validators.required]);
  DateOfBirth = new FormControl(null, [Validators.required]);
  PlaceOfBirth = new FormControl(null, [Validators.required]);

  constructor(
    private fireBaseEditService: FireBaseEditUserService,
    private activatedRoute: ActivatedRoute
  ) {}

  userForm = new FormGroup({
    NationalId: this.NationalId,
    Name: this.Name,
    DateOfBirth: this.DateOfBirth,
    PlaceOfBirth: this.PlaceOfBirth,
  });

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.class = this.activatedRoute.snapshot.paramMap.get('class');

    if (this.id && this.class) {
      // this.searchFile(this.id);

      this.searchData(this.id);
    }
  }

  // async searchFile(id: any) {
  //   const folderPath = this.class == 1 ? 'Class2024Intership' : 'NotYet';
  //   const fileName = `${id}.jpg`;

  //   await this.fireBaseEditService
  //     .getFileUrl(`${folderPath}/September`, fileName)
  //     .then(async (downloadUrl: any) => {
  //       if (downloadUrl) {
  //         this.defaultImage = downloadUrl;
  //       } else {
  //         await this.fireBaseEditService
  //           .getFileUrl(`${folderPath}/June`, fileName)
  //           .then((downloadUrl: any) => {
  //             if (downloadUrl) {
  //               this.defaultImage = downloadUrl;
  //             } else {
  //               this.defaultImage = 'assets/Images/DefaultImage.jpg';
  //             }
  //           });
  //       }
  //     });
  // }

  searchData(id: any) {
    const folderPath = this.class == 1 ? 'Class2024Intership' : 'NotYet';
    this.fireBaseEditService
      .getDataByPath(`${folderPath}/September/${id}`)
      .subscribe((data) => {
        if (data) {
          this.data = data;
          this.patchValues();
          console.log('Fetched Data:', data);
        } else {
          this.fireBaseEditService
            .getDataByPath(`${folderPath}/June/${id}`)
            .subscribe((data) => {
              if (data) {
                this.data = data;
                this.patchValues();
                console.log('Fetched Data:', data);
              }
            });
        }
      });
  }
  patchValues() {
    this.NationalId.patchValue(this.data.NationalId);
    this.Name.patchValue(this.data.Name);
    this.DateOfBirth.patchValue(this.data.DateOfBirth);
    this.PlaceOfBirth.patchValue(this.data.PlaceOfBirth);
    this.defaultImage = this.data.Image
      ? this.data.Image
      : 'assets/Images/DefaultImage.jpg';
  }

  onChangeDate(event: any) {
    this.selectedDate = `${event.year}-${event.month}-${event.day}`;
    this.DateOfBirth.patchValue(this.selectedDate);
    console.log(this.selectedDate);
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => (this.defaultImage = e.target.result);
      reader.readAsDataURL(event.target.files[0]);
      this.selectedImage = event.target.files[0];
    } else {
      this.defaultImage = 'assets/Images/DefaultImage.jpg';
      this.selectedImage = null;
    }
  }

  onSubmit(formValues: any) {
    var dataPath = `Class2024Intership/${this.data.ClassMonth}/${this.NationalId.value}`;
    var filePath = `Class2024Intership/${this.data.ClassMonth}/${this.NationalId.value}.jpg`;
    if (this.selectedImage) {
      this.fireBaseEditService.uploadToStorage(
        filePath,
        this.selectedImage,
        formValues
      );
      console.log(filePath);
    }
    if (!this.selectedImage && (this.userForm.dirty || this.selectedDate)) {
      console.log(formValues);

      this.fireBaseEditService.insertImageDetails(
        { ...formValues, ClassMonth: this.data.ClassMonth },
        dataPath
      );
    }
  }
}
