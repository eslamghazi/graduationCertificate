import { FireBaseAuthService } from './shared/fire-base-auth.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  auth = localStorage.getItem('adminCheck');
  authPrevilige = localStorage.getItem('adminCheck')?.split('-')[1]
  comingSoon = false;

  constructor(private firebaseAuthService: FireBaseAuthService) { }
  ngOnInit(): void {
    this.getAuth();
  }

  getAuth() {
    if (this.auth) {
      this.firebaseAuthService
        .getDataByPath('auth')
        .subscribe((data) => {

          if (data) {
            if (this.authPrevilige == '30110281500753') {
              this.comingSoon = true;
              localStorage.setItem('adminCheck', `superadmin-30110281500753`)
              if (data.Classes[data[this.authPrevilige as any].Class]) {
                localStorage.setItem('currentClass', data[this.authPrevilige as any].Class)

              } else {
                localStorage.setItem('currentClass', data.Classes.DefaultClass);
              }

              return;
            }

            if (data[this.authPrevilige as any]) {
              localStorage.setItem('adminCheck', `${data[this.authPrevilige as any].Auth}-${data[this.authPrevilige as any].NationalId}`)
            } else {
              localStorage.removeItem('adminCheck')

            }

            if (data.Classes[data[this.authPrevilige as any].Class]) {
              localStorage.setItem('currentClass', data[this.authPrevilige as any].Class)

            } else {
              localStorage.setItem('currentClass', data.Classes.DefaultClass);
            }

          }
        });

    } else {
      this.firebaseAuthService
        .getDataByPath('auth/comingSoon')
        .subscribe((data) => {
          if (data) {
            if (data) {
              this.comingSoon = data
            }
          }
        }
        )
    }
  }

}
