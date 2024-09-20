import { FireBaseAuthService } from './shared/fire-base-auth.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  auth = localStorage.getItem('adminCheck');
  comingSoon = false;

  constructor(private firebaseAuthService: FireBaseAuthService) { }
  ngOnInit(): void {
    this.getIsComingSoon();
    this.getDefaultClass();
  }

  getIsComingSoon() {
    if (localStorage.getItem('adminCheck')?.split('-')[1] == '30110281500753') {
      this.comingSoon = true;
      return;
    }
    this.firebaseAuthService
      .getDataByPath('auth/comingSoon')
      .subscribe((data) => {
        if (data) {
          this.comingSoon = data;
        }
      });
  }

  getDefaultClass() {
    if (this.auth) {
      this.firebaseAuthService.getDataByPath('auth/Classes/DefaultClass').subscribe((data) => {
        if (data) {
          console.log(data);

          localStorage.removeItem('defaultClass');
          localStorage.setItem('defaultClass', data);
        }
      })
    }
  }
}
