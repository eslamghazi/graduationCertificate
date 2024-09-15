import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit {
  superAdminAuth = localStorage.getItem('adminCheck') == '30110281500753';

  constructor(private router: Router) {}

  ngOnInit(): void {}

  goToMainPage() {
    this.router.navigateByUrl('/student/getStudentData');
  }
}
