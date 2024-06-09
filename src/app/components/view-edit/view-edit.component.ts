import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { ExcelReaderService } from 'src/app/services/excel-reader.service';

@Component({
  selector: 'app-view-edit',
  templateUrl: './view-edit.component.html',
  styleUrls: ['./view-edit.component.scss']
})
export class ViewEditComponent implements OnInit {
  id = new FormControl(null, [Validators.required]);

  excelData: any[][] = [];
  searchResult: any[] | null = null;
  notFound = false

  constructor(private excelReaderService: ExcelReaderService) { }
  idForm = new FormGroup({
    id: this.id,
  });

  ngOnInit(): void {
    this.loadExcelFile()
  }

  typingId(event: any) {
    this.notFound = false
    if (event.value) {
      if (!(event.value.length == 14)) {
        this.id.setErrors({ 'pattern': true })
      }

    }
  }


  loadExcelFile() {
    this.excelReaderService.loadEditFormExcelFile().subscribe(data => {
      this.excelData = data;
      console.log(this.excelData);

    }, error => {
      console.error('Error edit file:', error);
    });

  }

  onSearch() {

    // defaultSearchResult = this.excelReaderService.searchByStudentId(this.id.value as any, 'الرقم القومي', this.defaultExcelData);
    // if (defaultSearchResult == null) {
    // } else {
    //   this.searchResult = defaultSearchResult
    // }




  }
}
