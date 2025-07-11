import { Injectable } from '@angular/core';
import { Observable, from, of, combineLatest, map, catchError } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from './swal.service';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as JSZip from 'jszip';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SupabaseAdminService {
  supabase: SupabaseClient;

  private currentClass = localStorage.getItem('currentClass');

  constructor(
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private http: HttpClient,
    private router: Router
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
    const pageSize = 1000;
    let allData: any[] = [];
    let page = 0;

    const buildQuery = (from: number, to: number) => {
      let query = this.supabase.from(table).select('*').range(from, to);

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

      return query.order('created_at', { ascending: false });
    };

    return new Observable((observer) => {
      const fetchPage = async () => {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await buildQuery(from, to);

        if (error) {
          observer.error(error);
          return;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          if (data.length < pageSize) {
            observer.next(need === 'list' ? allData : allData[0]);
            observer.complete();
          } else {
            fetchPage(); // fetch next chunk
          }
        } else {
          observer.next(need === 'list' ? allData : allData[0]);
          observer.complete();
        }
      };

      fetchPage();
    }).pipe(
      catchError((error) => {
        console.error(`Error fetching data from ${table}:`, error);
        return of(null);
      })
    );
  }


  // List all folders in Supabase Storage (equivalent to Firebase listAllFolders)
  async listAllFolders(bucket: string = 'images'): Promise<string[]> {
    try {
      const folders: string[] = [];

      // Helper function to list all items with pagination
      const paginatedList = async (prefix: string): Promise<any[]> => {
        const allItems: any[] = [];
        const pageSize = 1000;
        let offset = 0;
        let done = false;

        while (!done) {
          const { data, error } = await this.supabase.storage.from(bucket).list(prefix, {
            limit: pageSize,
            offset,
            sortBy: { column: 'name', order: 'asc' },
          });

          if (error) throw new Error(error.message);
          if (!data || data.length === 0) break;

          allItems.push(...data);
          offset += pageSize;

          if (data.length < pageSize) {
            done = true;
          }
        }

        return allItems;
      };

      // Recursive folder listing
      const listSubfolders = async (prefix: string) => {
        const subData = await paginatedList(prefix);

        for (const item of subData) {
          if (item.metadata === null) {
            const folderPath = prefix ? `${prefix}/${item.name}` : item.name;
            folders.push(folderPath);
            await listSubfolders(folderPath);
          }
        }
      };

      // Start with root folders
      const rootData = await paginatedList('');
      for (const item of rootData) {
        if (item.metadata === null) {
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
      this.supabase.storage.from(bucket).list(path, { limit: 1500, offset: 0 })
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
        .list(path, { limit: 1500, offset: 0 })
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
              .list(prefix, { limit: 1500, offset: 0 });

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

  encryptFileName(filename: string): string {
    const parts = filename.split(".");
    const name = btoa(unescape(encodeURIComponent(parts.slice(0, -1).join("."))));
    const ext = parts.slice(-1)[0];
    return `${name}.${ext}`;
  }

  decryptFileName(encrypted: string): string {
    const parts = encrypted.split(".");
    const base64 = parts.slice(0, -1).join(".")
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      + "===".slice((parts[0].length + 3) % 4); // Restore padding
    const name = decodeURIComponent(escape(atob(base64)));
    const ext = parts.slice(-1)[0];
    return `${name}.${ext}`;
  }

  // Download a folder of images as a ZIP file
async downloadFolderAsZip(path: string, zipNameWillBe: string): Promise<void> {
  this.swal.toastr('info', 'جار تجهيز الصور ...');
  this.spinner.show();

  try {
    // Fetch all files with pagination
    let allFiles: any[] = [];
    let offset = 0;
    const limit = 1500;

    while (true) {
      const { data: files, error } = await this.supabase
        .storage
        .from('images')
        .list(path, { limit, offset });

      if (error) throw new Error(error.message);
      if (!files || files.length === 0) break;

      allFiles = allFiles.concat(files);
      offset += limit;
      if (files.length < limit) break; // No more files to fetch
    }

    if (allFiles.length === 0) throw new Error('No files found');

    const zip = new JSZip();
    const batchSize = 5; // Process 5 files at a time to avoid resource issues

    // Process files in batches
    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);
      const promises = batch.map(async (file) => {
        const { data: fileData, error: fileError } = await this.supabase
          .storage
          .from('images')
          .download(`${path}/${file.name}`);

        if (fileError) throw new Error(fileError.message);
        const arrayBuffer = await fileData.arrayBuffer();
        const decryptedFileName = this.decryptFileName(file.name);
        zip.file(decryptedFileName, arrayBuffer);
      });

      await Promise.all(promises); // Wait for the batch to complete
    }

    // Generate ZIP with compression to reduce memory usage
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Trigger download
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${zipNameWillBe}.zip`;
    link.click();
    window?.URL?.revokeObjectURL(url);

    this.spinner.hide();
    this.swal.toastr('success', 'تم تحضير الصور بنجاح');
  } catch (error: any) {
    this.spinner.hide();
    this.swal.toastr('error', `حدث خطأ أثناء تحضير الصور: ${error.message}`);
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

    const updatedData = data.map((item: any) => ({
      ...item,
      created_at: new Date().toISOString()
    }));


    try {
      const { error } = await this.supabase
        .from(table)
        .upsert(updatedData);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error(`Error upserting ${table} data:`, error);
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
    } catch (error) {
      console.error(`Error deleting records from ${table}:`, error);
      throw error;
    }
  }
}
