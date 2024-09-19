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

  constructor(private firebaseAuthService: FireBaseAuthService) {}
  ngOnInit(): void {
    this.getIsComingSoon();
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
}
