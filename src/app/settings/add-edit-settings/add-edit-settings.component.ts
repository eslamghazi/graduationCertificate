import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-edit-settings',
  templateUrl: './add-edit-settings.component.html',
  styleUrls: ['./add-edit-settings.component.scss']
})
export class AddEditSettingsComponent implements OnInit {
  @Input() header: string = '';
  @Input() footer: string = '';
  @Input() data: any;

  Id = new FormControl(null, [Validators.required])
  Name = new FormControl(null, [Validators.required])

  constructor(public activeModal: NgbActiveModal) { }
  addEditForm = new FormGroup({
    Id: this.Id,
    Name: this.Name,
  })
  ngOnInit(): void {
    if (this.data) {
      this.addEditForm.patchValue({
        Id: this.data.Id,
        Name: this.data.Name
      });
    }

  }
  confirm() {
    this.activeModal.close(this.addEditForm.value);
  }
}
