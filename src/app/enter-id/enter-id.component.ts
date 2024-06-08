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
  excelData: any[][] = [];
  searchResult: any[] | null = null;
  headers: string[] = [];
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
    console.log(event.value);
    if (event.value) {
      if (!(event.value.length == 14)) {
        this.id.setErrors({ 'pattern': true })
      }

    }
  }


  loadExcelFile() {
    this.excelReaderService.loadExcelFile('assets/excelSheets/default.xlsx').subscribe(data => {
      this.excelData = data;
      this.headers = this.excelReaderService.getHeaders();
    }, error => {
      console.error('Error loading file:', error);
    });
  }

  onSearch() {
    this.searchResult = this.excelReaderService.searchByStudentId(this.id.value as any, 'الرقم القومي');
    console.log(this.searchResult);
    if (this.searchResult == null) {
      this.notFound = true
    }
  }
}
