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
  image: any
  excelData: any

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
    this.excelReaderService.getExcelFile().subscribe({
      next: blob => {
        if (blob instanceof Blob) {
          this.blobToArrayBuffer(blob).then(arrayBuffer => {
            // Handle the ArrayBuffer
            this.excelData = this.excelReaderService.loadExcelFileContent(arrayBuffer)
            console.log(this.excelData);

          }).catch(error => {
            console.error('Error converting blob to array buffer:', error);
          });
        } else {
          console.error('The fetched data is not a Blob:', blob);
        }
      },
      error: error => {
        console.error('Error fetching Excel file:', error);
      }
    });
  }

  blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as ArrayBuffer);
        } else {
          reject(new Error('FileReader failed to convert blob to array buffer'));
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader encountered an error'));
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  async onSearch() {
    this.searchResult = this.excelReaderService.searchByStudentId(this.id.value as any, 'الرقم القومي', this.excelData);
    if (this.searchResult == null) {
      this.notFound = true
    } else {
      await this.convertImageToBase64(this.searchResult[5])
      this.notFound = false

    }
  }


  async convertImageToBase64(url: string): Promise<void> {
    try {
      this.image = await this.excelReaderService.fetchImageAsBase64(url);
      console.log('Base64 Image:', this.image);
    } catch (error) {
      console.error('Error fetching and converting image:', error);
    }
  }

}
