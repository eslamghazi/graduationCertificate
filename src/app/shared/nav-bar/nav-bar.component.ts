import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit {
  superAdminAuth =
    localStorage.getItem('adminCheck')?.split('-')[0] == 'superadmin';

  constructor(private router: Router) { }

  ngOnInit(): void { }

  goToMainPage() {
    this.router.navigateByUrl('/student/getStudentData');
  }

  logout() {
    if (localStorage.getItem('adminCheck')) {
      localStorage.removeItem('adminCheck');
      window.location.reload();
    }
    if (localStorage.getItem('currentClass')) {
      localStorage.removeItem('currentClass');
      window.location.reload();
    }
  }
}
