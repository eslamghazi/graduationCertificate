import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelReaderService {

  private excelData: any[][] = [];
  private headers: any

  constructor(private http: HttpClient) { }

  loadExcelFile(filePath: string): Observable<any[][]> {
    return this.http.get(filePath, { responseType: 'arraybuffer' }).pipe(
      map(data => {
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        this.excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        this.headers = this.excelData.shift(); // Extract and remove headers from data
        return this.excelData;
      })
    );
  }

  searchByStudentId(studentId: string | number, header: string): any[] | null {
    const studentIdIndex = this.headers.indexOf(header);
    if (studentIdIndex === -1) {
      return null;
    }
    for (let i = 0; i < this.excelData.length; i++) {
      if (this.excelData[i][studentIdIndex] == studentId) {
        return this.excelData[i];
      }
    }
    return null;
  }

  getHeaders(): string[] {
    return this.headers;
  }
}
