import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExcelReaderService } from '../excel-reader.service';

@Component({
  selector: 'app-enter-id',
  templateUrl: './enter-id.component.html',
  styleUrls: ['./enter-id.component.scss']
})
export class EnterIdComponent implements OnInit {
  id = new FormControl(null, [Validators.required]);

  defaultExcelData: any[][] = [];
  defaultExcelHeaders: string[] = [];

  editExcelData: any[][] = [];
  editExcelHeaders: string[] = [];

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
    // this.excelReaderService.loadExcelFile('assets/excelSheets/edit.xlsx').subscribe(data => {
    //   this.editExcelData = data;

    this.excelReaderService.loadExcelFile('assets/excelSheets/default.xlsx').subscribe(data => {
      this.defaultExcelData = data;

    }, error => {
      console.error('Error default file:', error);
    })

    // }, error => {
    //   console.error('Error edit file:', error);
    // });

  }

  onSearch() {
    let defaultSearchResult
    // let editSearchResult

    // editSearchResult = this.excelReaderService.searchByStudentId(this.id.value as any, 'الرقم القومي', this.editExcelData);
    // if (editSearchResult == null) {
    defaultSearchResult = this.excelReaderService.searchByStudentId(this.id.value as any, 'الرقم القومي', this.defaultExcelData);
    if (defaultSearchResult == null) {
      this.notFound = true
    } else {
      this.searchResult = defaultSearchResult
    }
    // } else {
    //   this.searchResult = editSearchResult
    // }




  }
}
