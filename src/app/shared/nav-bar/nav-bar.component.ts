import { FireBaseEditUserService } from 'src/app/shared/fire-base-edit-user.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit {
  superAdminAuth = localStorage.getItem('adminCheck') == '30110281500753';
  comingSoon = localStorage.getItem('comingSoon');

  constructor(
    private router: Router,
    private firebaseEditUserService: FireBaseEditUserService
  ) {}

  ngOnInit(): void {}

  goToMainPage() {
    this.router.navigateByUrl('/student/getStudentData');
  }

  logout() {
    if (localStorage.getItem('adminCheck')) {
      localStorage.removeItem('adminCheck');
      window.location.reload();
    }
  }

  changeComingSoon() {
    if (this.comingSoon) {
      this.firebaseEditUserService.insertIntoDb('comingSoon', false);
      localStorage.removeItem('comingSoon');
      window.location.reload();
    } else {
      this.firebaseEditUserService.insertIntoDb('comingSoon', true);
      window.location.reload();
    }
  }
}
