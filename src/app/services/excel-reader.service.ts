import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelReaderService {
  private vercelApiUrl = 'https://graduation-certificate.vercel.app/api/get-excel';

  constructor(private http: HttpClient) { }

  loadEditFormExcelFile(): Observable<any> {
    return this.http.get(this.vercelApiUrl, { responseType: 'blob' });
  }

  loadExcelFile(filePath: string): Observable<any> {
    let excelData
    let headers
    return this.http.get(filePath, { responseType: 'arraybuffer' }).pipe(
      map(data => {
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        headers = excelData.shift(); // Extract and remove headers from data

        return { excelData, headers };
      })
    );
  }

  searchByStudentId(studentId: string | number, header: string, content: any): any[] | null {
    const studentIdIndex = content.headers.indexOf(header);
    if (studentIdIndex === -1) {
      return null;
    }
    for (let i = 0; i < content.excelData.length; i++) {
      if (content.excelData[i][studentIdIndex] == studentId) {
        return content.excelData[i];
      }
    }
    return null;
  }

}
