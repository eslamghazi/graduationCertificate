import { Injectable } from '@angular/core';
import { Observable, from, of, combineLatest, map, catchError } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from './swal.service';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as JSZip from 'jszip';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseAdminService {
  supabase: SupabaseClient;

  private currentClass = localStorage.getItem('currentClass');

  constructor(
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private http: HttpClient
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  // Fetch data from a specific table with optional filters
  getAllData(table: string, filters: any = {}, need = 'list'): Observable<any> {
    let query = this.supabase.from(table).select('*');

    for (const key in filters) {
      if (filters[key]) {
        if (filters[key].type === 'like') {
          query = query.like(key, filters[key].value);
        } else if (filters[key].type === 'ilike') {
          query = query.ilike(key, filters[key].value);
        } else {
          query = query.eq(key, filters[key]);
        }
      }
    }

    return from(query).pipe(
      map((response: any) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return need === 'list' ? response.data : response.data[0];
      }),
      catchError((error) => {
        console.error(`Error fetching data from ${table}:`, error);
        return of(null);
      })
    );
  }

  // List all folders in Supabase Storage (equivalent to Firebase listAllFolders)
  async listAllFolders(bucket: string = 'images'): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.storage.from(bucket).list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw new Error(error.message);
      if (!data) return [];

      // Recursively list all folders and subfolders
      const folders: string[] = [];
      const listSubfolders = async (prefix: string) => {
        const { data: subData, error: subError } = await this.supabase.storage
          .from(bucket)
          .list(prefix, { limit: 1000, offset: 0 });

        if (subError) throw new Error(subError.message);
        if (!subData) return;

        for (const item of subData) {
          if (item.metadata === null) { // Folders have metadata === null
            const folderPath = prefix ? `${prefix}/${item.name}` : item.name;
            folders.push(folderPath);
            await listSubfolders(folderPath);
          }
        }
      };

      for (const item of data) {
        if (item.metadata === null) { // Folders have metadata === null
          folders.push(item.name);
          await listSubfolders(item.name);
        }
      }

      return folders;
    } catch (error) {
      console.error('Error listing folders:', error);
      throw error;
    }
  }

  // Get all file names in a folder (equivalent to Firebase getFileNames)
  getFileNames(path: string, bucket: string = 'images'): Observable<string[]> {
    return from(
      this.supabase.storage.from(bucket).list(path, { limit: 1000, offset: 0 })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data.map((item: any) => item.name);
      }),
      catchError((error) => {
        console.error(`Error fetching file names for path ${path}:`, error);
        return of([]);
      })
    );
  }

  // Delete a folder and all its contents from Supabase Storage
  deleteFolder(path: string, bucket: string = 'images'): Observable<void> {
    return new Observable((observer) => {
      this.supabase.storage
        .from(bucket)
        .list(path, { limit: 1000, offset: 0 })
        .then(async ({ data, error }) => {
          if (error) {
            observer.error(error);
            return;
          }

          if (!data || data.length === 0) {
            observer.next();
            observer.complete();
            return;
          }

          // Collect all file paths to delete
          const filePaths: string[] = [];
          const listFiles = async (prefix: string) => {
            const { data: subData, error: subError } = await this.supabase.storage
              .from(bucket)
              .list(prefix, { limit: 1000, offset: 0 });

            if (subError) throw new Error(subError.message);
            if (!subData) return;

            for (const item of subData) {
              const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
              if (item.metadata !== null) { // Files have metadata
                filePaths.push(itemPath);
              } else {
                await listFiles(itemPath); // Recursively list subfolders
              }
            }
          };

          await listFiles(path);

          // Delete all files
          if (filePaths.length > 0) {
            const { error: deleteError } = await this.supabase.storage
              .from(bucket)
              .remove(filePaths);

            if (deleteError) {
              observer.error(deleteError);
              return;
            }
          }

          observer.next();
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  // Download a folder of images as a ZIP file
  async downloadFolderAsZip(path: string, zipNameWillBe: string): Promise<void> {

    this.swal.toastr('warning', 'جار تجهيز الصور ...');
    this.spinner.show();

    try {
      const { data: files, error } = await this.supabase
        .storage
        .from('images')
        .list(path, { limit: 1000, offset: 0 });

      if (error) throw new Error(error.message);
      if (!files || files.length === 0) throw new Error('No files found');

      const zip = new JSZip();
      for (const file of files) {
        const { data: fileData, error: fileError } = await this.supabase
          .storage
          .from('images')
          .download(`${path}/${file.name}`);

        if (fileError) throw new Error(fileError.message);
        const arrayBuffer = await fileData.arrayBuffer();
        zip.file(file.name, arrayBuffer);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${zipNameWillBe}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.spinner.hide();
      this.swal.toastr('success', 'تم تحضير الصور بنجاح');
    } catch (error) {
      this.spinner.hide();
      this.swal.toastr('error', 'حدث خطأ أثناء تحضير الصور');
      throw error;
    }
  }

  // Delete a file from Supabase Storage and remove the 'image_url' property
  deleteFileAndImageProperty(
    folderPath: string,
    dbPath: string,
    deleteState: string
  ): Observable<void> {
    return new Observable((observer) => {
      this.supabase
        .storage
        .from('images')
        .remove([folderPath])
        .then(({ error }) => {
          if (error) {
            this.swal.toastr('error', 'عفوًا حدث خطأ أثناء حذف الصورة من السيرفر');
            throw error;
          }
          this.swal.toastr('success', 'تم حذف الصورة من السيرفر بنجاح');

          this.removeImagePropertyFromDatabase(dbPath, deleteState)
            .then(() => {
              this.swal.toastr(
                'success',
                deleteState === 'deleteImageOnly'
                  ? 'تم حذف الصورة من قاعدة البيانات بنجاح'
                  : 'تم حذف الطالب من قاعدة البيانات بنجاح'
              );
              observer.next();
              observer.complete();
            })
            .catch((error) => {
              this.swal.toastr(
                'error',
                deleteState === 'deleteImageOnly'
                  ? 'عفوًا حدث خطأ أثناء حذف الصورة من قاعدة البيانات'
                  : 'عفوًا حدث خطأ أثناء حذف الطالب من قاعدة البيانات'
              );
              observer.error(error);
            });
        })
        .catch((error) => {
          this.removeImagePropertyFromDatabase(dbPath, deleteState)
            .then(() => {
              this.swal.toastr(
                'success',
                deleteState === 'deleteImageOnly'
                  ? 'تم حذف الصورة من قاعدة البيانات بنجاح'
                  : 'تم حذف الطالب من قاعدة البيانات بنجاح'
              );
              observer.next();
              observer.complete();
            })
            .catch((error) => {
              this.swal.toastr(
                'error',
                deleteState === 'deleteImageOnly'
                  ? 'عفوًا حدث خطأ أثناء حذف الصورة من قاعدة البيانات'
                  : 'عفوًا حدث خطأ أثناء حذف الطالب من قاعدة البيانات'
              );
              observer.error(error);
            });
        });
    });
  }

  async removeImagePropertyFromDatabase(
    dbPath: string,
    deleteState: string,
    table: string = 'students'
  ): Promise<void> {
    const pathParts = dbPath.split('/');
    const id = pathParts[pathParts.length - 1];

    try {
      if (deleteState === 'deleteAuthor') {
        const { error } = await this.supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw new Error(error.message);
      } else if (deleteState === 'deleteAll') {
        const { error } = await this.supabase
          .from(table)
          .delete()
          .eq('subclass_id', id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await this.supabase
          .from(table)
          .update({ image_url: null })
          .eq('id', id);
        if (error) throw new Error(error.message);
      }
    } catch (error) {
      console.error(`Error removing record from ${table}:`, error);
      throw error;
    }
  }

  // Check if an image URL is valid
  checkImageUrl(url: string): Observable<boolean> {
    const regex = /^(http:\/\/|https:\/\/)/;
    if (!regex.test(url)) {
      return of(false);
    }
    return this.http.head(url, { observe: 'response' }).pipe(
      map((response) => response.status === 200),
      catchError(() => of(false))
    );
  }

  // Search for a student across classes and subclasses
  searchObject(groups: string[], objectKey: string): Observable<any[]> {
    const observables: Observable<any[]>[] = groups.map((group) =>
      this.getAllData('students', {
        subclass_id: group,
        id: { type: 'ilike', value: `%${objectKey}%` },
      }).pipe(
        map((data) => {
          return (Array.isArray(data) ? data : []).map((student) => ({
            source: group,
            data: student,
          }));
        }),
        catchError(() => of([]))
      )
    );

    return new Observable((observer) => {
      combineLatest(observables).subscribe(
        (resultsArray) => {
          const validResults = resultsArray
            .flat()
            .filter((result) => result && result.data);
          observer.next(validResults);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  // Process an Excel file for importing student data
  public processExcelFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader: FileReader = new FileReader();

      reader.onload = (e: any) => {
        const binaryData: string = e.target.result;
        const workbook: XLSX.WorkBook = XLSX.read(binaryData, {
          type: 'binary',
        });

        const sheetName: string = workbook.SheetNames[0];
        const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const structuredData = this.transformData(rawData);
        resolve(structuredData);
      };

      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  }

  // Transform raw Excel data into the desired structure for Supabase
  private transformData(rawData: any[]): any {
    const result: any[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const id = row[0]; // ID
      const name = row[1]; // Name
      const nationalId = row[2]; // NationalId
      const dateOfBirth = row[3]; // Date of Birth
      const placeOfBirth = row[4]; // Place of Birth
      const classMonth = row[5]; // ClassMonth (e.g., June, September)

      result.push({
        id: nationalId, // Use NationalId as the primary key
        name: name,
        national_id: nationalId,
        date_of_birth: dateOfBirth,
        place_of_birth: placeOfBirth,
        class_id: this.currentClass,
        subclass_id: `${this.currentClass}-${classMonth}`,
      });
    }

    return result;
  }

  // Push student data to Supabase
  async upsertData(data: any[], table: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(table)
        .upsert(data);
      if (error) throw new Error(error.message);
      console.log(`${table} data upserted successfully`);
    } catch (error) {
      console.error(`Error upserting ${table} data:`, error);
      throw error;
    }
  }

  // Remove a specific student entry from Supabase
  async removeEntry(classId: string, subclassId: string, nationalId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('students')
        .delete()
        .eq('id', nationalId);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error(`Error removing student ${nationalId}:`, error);
      throw error;
    }
  }

  // Delete multiple records from a specified table by IDs
  async deleteMultiple(ids: string[], table: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .in('id', ids);
      if (error) throw new Error(error.message);
      console.log(`Deleted ${ids.length} records from ${table}`);
    } catch (error) {
      console.error(`Error deleting records from ${table}:`, error);
      throw error;
    }
  }
}
