import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedModalComponent } from '../shared-modal/shared-modal.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent {
  superAdminAuth =
    localStorage.getItem('adminCheck')?.split('-')[0] == 'superadmin';

  constructor(
    private router: Router,
    private modalService: NgbModal,
  ) { }

  goToMainPage() {
    this.router.navigateByUrl('/student/getStudentData');
  }

  logout() {
        const modalRef = this.modalService.open(SharedModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
        });

        modalRef.componentInstance.warningSvg = true;
        modalRef.componentInstance.message =
          'هل انت متأكد من إلغاء صلاحياتك ؟';

        modalRef.result.then((result) => {
          if (result) {
            localStorage.removeItem('adminCheck');
            localStorage.removeItem('currentClass');
            this.collapseNav();
            window.location.reload();
          }
        });
    }

  collapseNav() {
    const navCollapse = document.getElementById('navbarSupportedContent');
  if (navCollapse?.classList.contains('show')) {
    navCollapse.classList.remove('show'); // Collapse it
  }
  }
}
