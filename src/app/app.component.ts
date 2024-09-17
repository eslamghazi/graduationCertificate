import { FireBaseEditUserService } from './shared/fire-base-edit-user.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  auth = localStorage.getItem('adminCheck');
  comingSoon = false;

  constructor(private firebaseEditUserService: FireBaseEditUserService) {}
  ngOnInit(): void {
    this.getIsComingSoon();
  }

  getIsComingSoon() {
    this.firebaseEditUserService
      .getDataByPath('comingSoon')
      .subscribe((data) => {
        if (data) {
          this.comingSoon = data;
          localStorage.setItem('comingSoon', data);
        }
      });
  }
}
