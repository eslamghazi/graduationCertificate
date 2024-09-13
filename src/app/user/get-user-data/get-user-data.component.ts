import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FireBaseUserService } from 'src/app/shared/fire-base-user.service';

@Component({
  selector: 'app-get-user-data',
  templateUrl: './get-user-data.component.html',
  styleUrls: ['./get-user-data.component.scss'],
})
export class GetUserDataComponent implements OnInit {
  notFound = false;

  selectClass = new FormControl(0, [Validators.required]);
  NationalId = new FormControl(null, [Validators.required]);

  constructor(
    private fireBaseUserService: FireBaseUserService,
    private route: Router
  ) {}

  userForm = new FormGroup({
    selectClass: this.selectClass,
    NationalId: this.NationalId,
  });

  ngOnInit(): void {}

  typingId(event: any) {
    this.notFound = false;
    if (event.value) {
      if (!(event.value.length == 14)) {
        this.NationalId.setErrors({ pattern: true });
      }
    }
  }

  async searchFile() {
    const folderPath =
      this.selectClass.value == 1 ? 'Class2024Intership' : 'NotYet';
    const fileName = `${this.NationalId.value}.jpg`;

    await this.fireBaseUserService
      .getFileUrl(`${folderPath}/September`, fileName)
      .then(async (downloadUrl) => {
        if (downloadUrl) {
          this.notFound = false;
          this.route.navigateByUrl(
            `/getUserData/${this.selectClass.value}/${this.NationalId.value}`
          );
        } else {
          await this.fireBaseUserService
            .getFileUrl(`${folderPath}/June`, fileName)
            .then((downloadUrl) => {
              if (downloadUrl) {
                this.notFound = false;
                this.route.navigateByUrl(
                  `/getUserData/${this.selectClass.value}/${this.NationalId.value}`
                );
              } else {
                this.notFound = true;
              }
            });
        }
      });
  }
}
