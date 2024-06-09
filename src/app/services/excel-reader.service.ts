import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelReaderService {
  private vercelApiUrl = 'https://graduation-certificate.vercel.app/api/get-excel';

  constructor(private http: HttpClient) { }
  getExcelFile(): Observable<Blob> {
    return this.http.get(this.vercelApiUrl, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Error fetching Excel file:', error);
        return throwError(() => new Error('Error fetching Excel file'));
      })
    );
  }

  loadExcelFile(filePath: string): Observable<any> {
    let excelData
    let headers
    return this.http.get(filePath as any, { responseType: 'arraybuffer' }).pipe(
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

  loadExcelFileContent(content: any): any {
    let excelData
    let headers
    const workbook = XLSX.read(new Uint8Array(content as any), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    headers = excelData.shift(); // Extract and remove headers from data
    return { excelData, headers } as any;
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



  async fetchImageAsBase64(url: string): Promise<string> {
    debugger
    const proxyUrl = `https://graduation-certificate.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert to base64'));
      reader.readAsDataURL(blob);
    });
  }

}
