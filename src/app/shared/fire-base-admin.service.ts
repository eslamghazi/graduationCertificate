import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import {
  catchError,
  combineLatest,
  concatMap,
  from,
  map,
  Observable,
  of,
} from 'rxjs';
import { downloadFolderAsZip } from './downloadFolderAsZip';
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from './swal.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class FireBaseAdminService {
  constructor(
    private firebaseDb: AngularFireDatabase,
    private storage: AngularFireStorage,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private http: HttpClient
  ) {}

  getAllData(path = '/', need = 'list'): Observable<any> {
    return need == 'list'
      ? this.firebaseDb.list(path).valueChanges()
      : this.firebaseDb.object(path).valueChanges();
  }

  async downloadFolderAsZip(path: any, zipNameWillBe: any) {
    this.swal.toastr('warning', 'جار تجهيز الصور ...');
    this.spinner.show();
    await downloadFolderAsZip(path, zipNameWillBe);
    this.spinner.hide();
    this.swal.toastr('success', 'تم تحضير الصور بنجاح');
  }

  async listAllFolders(path: string = ''): Promise<string[]> {
    const folderPaths: string[] = [];
    const ref = this.storage.ref(path);

    try {
      const result: any = await ref.listAll().toPromise();
      if (path) {
        folderPaths.push(path); // Add current folder
      }
      // Recursively get subfolders
      for (const folder of result.prefixes) {
        folderPaths.push(...(await this.listAllFolders(folder.fullPath)));
      }
      return folderPaths;
    } catch (error) {
      console.error('Error listing folders:', error);
      return [];
    }
  }

  getFileNames(folderPath: string): Observable<string[]> {
    const folderRef = this.storage.ref(folderPath);

    return folderRef.listAll().pipe(
      map((listResult) => {
        // Check the items and prefixes returned by listAll()
        const fileNames = listResult.items.map((itemRef) => itemRef.name);
        const folderNames = listResult.prefixes.map(
          (prefixRef) => prefixRef.fullPath
        );

        console.log('Files:', fileNames);
        console.log('Subfolders:', folderNames);

        return fileNames.length > 0 ? fileNames : folderNames;
      })
    );
  }

  deleteFolder(folderPath: string): Observable<void> {
    const folderRef = this.storage.ref(folderPath);

    // Return an Observable to delete the folder
    return new Observable((observer) => {
      folderRef
        .listAll()
        .pipe(
          concatMap((listResult) => {
            // Delete all files in the folder
            const deleteFiles$ = from(
              Promise.all(listResult.items.map((itemRef) => itemRef.delete()))
            );
            console.log('deleteFiles$', deleteFiles$);

            // Recursively delete subfolders
            const deleteSubfolders$ = from(
              Promise.all(
                listResult.prefixes.map((subfolderRef) =>
                  this.deleteFolder(subfolderRef.fullPath).toPromise()
                )
              )
            );
            console.log('deleteSubfolders$', deleteSubfolders$);

            return deleteFiles$.pipe(concatMap(() => deleteSubfolders$));
          })
        )
        .subscribe({
          next: () => {
            observer.next();
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  // Method to delete a file from Firebase Storage and remove the 'Image' property
  deleteFileAndImageProperty(
    folderPath: string,
    dbPath: string,
    deleteState: string
  ): Observable<void> {
    return new Observable((observer) => {
      // Reference to the file in Firebase Storage
      const fileRef = this.storage.ref(`${folderPath}`);

      // Delete the file from Firebase Storage
      fileRef
        .delete()
        .toPromise()
        .then(() => {
          this.swal.toastr('success', 'تم حذف الصورة من السيرفر بنجاح');

          // After deleting the file, remove the 'Image' property from the Realtime Database
          this.removeImagePropertyFromDatabase(dbPath, deleteState)
            .then(() => {
              this.swal.toastr(
                'success',
                'تم حذف الصورة من قاعدة البيانات بنجاح'
              );
              observer.next(); // Notify success
              observer.complete();
            })
            .catch((error) => {
              this.swal.toastr(
                'error',
                'عفوًا حدث خطأ اثناء حذف الصورة من قاعدة البيانات'
              );
              observer.error(error);
            });
        })
        .catch((error) => {
          this.removeImagePropertyFromDatabase(dbPath, deleteState)
            .then(() => {
              this.swal.toastr(
                'success',
                deleteState == 'deleteImageOnly'
                  ? 'تم حذف الصورة من قاعدة البيانات بنجاح'
                  : 'تم حذف الطالب من قاعدة البيانات بنجاح'
              );
              observer.next(); // Notify success
              observer.complete();
            })
            .catch((error) => {
              this.swal.toastr(
                'error',
                deleteState == 'deleteImageOnly'
                  ? 'عفوًا حدث خطأ اثناء حذف الصورة من قاعدة البيانات'
                  : 'عفوًا حدث خطأ اثناء حذف الطالب من قاعدة البيانات'
              );
              observer.error(error);
            });
          this.swal.toastr(
            'error',
            'عفوًا حدث خطأ اثناء حذف الصورة من السيرفر'
          );
          observer.error(error);
        });
    });
  }

  // Helper method to remove the 'Image' property from Firebase Realtime Database
  public removeImagePropertyFromDatabase(
    dbPath: string,
    deleteState: string
  ): Promise<void> {
    // Reference to the specific object in Firebase Realtime Database
    const dbRef = this.firebaseDb.object(dbPath);
    // Update the object by setting the 'Image' property to null (removes it)
    return deleteState == 'deleteAll'
      ? dbRef.remove()
      : dbRef.update({ Image: null });
  }

  // Function to check if an image URL is valid
  checkImageUrl(url: string) {
    const regex = /^(http:\/\/|https:\/\/)/;
    if (!regex.test(url)) {
      return of(false);
    }
    // Try to fetch the image. If status is 404 or error, image is broken
    return this.http.head(url, { observe: 'response' }).pipe(
      map((response) => response.status === 200),
      // Catch error (e.g., if 404 or unreachable) and return false
      catchError(() => of(false))
    );
  }

  // Function to remove the Image property for a student
  removeImageProperty(path: string) {
    const studentRef = this.firebaseDb.object(`${path}`);
    return studentRef.update({ Image: null });
  }

  // Function to search across objects1 and objects2
  searchObject(groups: string[], objectKey: string): Observable<any[]> {
    const observables: Observable<any>[] = groups.map((group) =>
      this.firebaseDb
        .object(`/${group}/${objectKey}`)
        .valueChanges()
        .pipe(
          map((data) => ({ source: group, data })), // Attach group info to data
          catchError(() => of(null)) // Ensure any error doesn't break the chain
        )
    );

    return new Observable((observer) => {
      combineLatest(observables).subscribe(
        (resultsArray) => {
          // Filter out any null or invalid results
          const validResults = resultsArray.filter(
            (result) => result && result.data
          );
          observer.next(validResults); // Emit valid results only
          observer.complete();
        },
        (error) => {
          observer.error(error); // Handle any errors from the observables
        }
      );
    });
  }

  // Function to read and process the Excel file
  public processExcelFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader: FileReader = new FileReader();

      reader.onload = (e: any) => {
        const binaryData: string = e.target.result;
        const workbook: XLSX.WorkBook = XLSX.read(binaryData, {
          type: 'binary',
        });

        // Get the first sheet
        const sheetName: string = workbook.SheetNames[0];
        const sheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Transform and structure the data
        const structuredData = this.transformData(rawData);
        resolve(structuredData);
      };

      reader.onerror = (error) => reject(error);

      reader.readAsBinaryString(file);
    });
  }

  // Function to transform raw Excel data into the desired structure
  private transformData(rawData: any[]): any {
    const result: any = {
      Class2024Intership: {},
    };

    // Iterate through the rows, skipping the header (rawData[0])
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];

      // Map the columns according to your Excel structure
      const id = row[0]; // Name
      const name = row[1]; // Name
      const nationalId = row[2]; // NationalId
      const dateOfBirth = row[3]; // Date of Birth
      const placeOfBirth = row[4]; // Place of Birth
      const classMonth = row[5]; // ClassMonth (e.g., June, July, etc.)
      // const image = row[6]; // Image

      // Initialize the month if it doesn't exist
      if (!result.Class2024Intership[classMonth]) {
        result.Class2024Intership[classMonth] = {};
      }

      // Add the entry under the month using NationalId as the key
      result.Class2024Intership[classMonth][nationalId] = {
        id: id,
        Name: name,
        NationalId: nationalId,
        DateOfBirth: dateOfBirth,
        PlaceOfBirth: placeOfBirth,
        ClassMonth: classMonth,
        // Image: image
      };
    }

    return result; // Return the structured data
  }

  // Push the entire Class2024Intership object to Firebase
  async pushClassData(classData: any, object: any = '/'): Promise<void> {
    try {
      await this.firebaseDb.object(object).set(classData);
      return console.log('Class2024Intership data pushed successfully');
    } catch (error) {
      return console.error('Error pushing Class2024Intership data:', error);
    }
  }

  // Remove a specific entry from Firebase
  removeEntry(month: string, nationalId: string): Promise<void> {
    return this.firebaseDb
      .object(`Class2024Intership/${month}/${nationalId}`)
      .remove();
  }
}
