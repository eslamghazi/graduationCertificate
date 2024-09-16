import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-shared-modal',
  templateUrl: './shared-modal.component.html',
  styleUrls: ['./shared-modal.component.scss'],
})
export class SharedModalComponent implements OnInit {
  @Input() deleteSvg = false;
  @Input() warningSvg = false;
  @Input() message: string = '';

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {}

  confirm() {
    this.activeModal.close(true);
  }
}
