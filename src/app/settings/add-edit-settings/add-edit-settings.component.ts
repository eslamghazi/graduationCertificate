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
  @Input() isReadonly: boolean = false;

  id = new FormControl(null, [Validators.required])
  name = new FormControl(null, [Validators.required])

  constructor(public activeModal: NgbActiveModal) { }
  addEditForm = new FormGroup({
    id: this.id,
    name: this.name,
  })
  ngOnInit(): void {
    if (this.data) {
      this.addEditForm.patchValue({
        id: this.data.id,
        name: this.data.name
      });
    }

if (this.isReadonly) {
  document.getElementById('idInput')?.setAttribute('readonly', "true");
}
  }
  confirm() {
    this.activeModal.close(this.addEditForm.value);
  }
}
