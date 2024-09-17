import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgxSpinnerService } from 'ngx-spinner';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  take,
} from 'rxjs';
import { SwalService } from './swal.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FireBaseEditUserService {
  constructor(
    private firebaseDb: AngularFireDatabase,
    private storage: AngularFireStorage,
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private http: HttpClient
  ) {}

  getDataByPath(path: string): Observable<any> {
    return this.firebaseDb.object(path).valueChanges(); // Fetches data from the specified path
  }

  async getDataByPathPromise(path: string): Promise<any> {
    // This method still returns an Observable
    const data$ = this.firebaseDb.object(path).valueChanges();

    // Convert Observable to Promise using firstValueFrom
    return await firstValueFrom(data$);
  }

  getAllData(path = '/'): Observable<any> {
    return this.firebaseDb.list(path).valueChanges();
  }

  async uploadToStorage(
    filePath: string,
    selectedImage: File,
    formValues: any
  ): Promise<void> {
    // this.spinner.show();
    const fileRef = this.storage.ref(filePath);

    try {
      // Upload the file to Firebase Storage
      const task = this.storage.upload(filePath, selectedImage);

      // Return a Promise that resolves when the upload is complete
      await new Promise<void>((resolve, reject) => {
        task
          .snapshotChanges()
          .pipe(
            finalize(() => {
              // Get the download URL after upload completes
              fileRef.getDownloadURL().subscribe(
                (url) => {
                  this.swal.toastr('success', 'تم رفع الصورة بنجاح');

                  // Call your existing functions with updated form values
                  this.getAllData(`${formValues.NationalId}`);
                  this.insertImageDetails(
                    { ...formValues, Image: url },
                    filePath.split('.')[0]
                  );

                  // Resolve the Promise after successful operations
                  resolve();
                },
                (error) => {
                  this.swal.toastr('error', 'حدث خطأ اثناء الرفع');
                  reject(error); // Reject if getting the URL fails
                }
              );
              // this.spinner.hide();
            })
          )
          .subscribe({
            error: (error) => {
              this.swal.toastr('error', 'حدث خطأ اثناء الرفع');
              reject(error); // Reject if there's an error during the upload
              // this.spinner.hide();
            },
          });
      });
      // this.spinner.hide();
    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ اثناء الرفع');
      // this.spinner.hide();
      throw error; // Rethrow the error to handle it in calling code if needed
    }
  }

  async insertImageDetails(imageDetails: any, path: any): Promise<void> {
    // this.spinner.show();
    if (!path) {
      this.swal.toastr('error', 'خطأ في الرقم القومي');
      // this.spinner.hide();
      return;
    }

    try {
      const entryExists = await this.checkEntryExists(path);

      if (entryExists) {
        this.swal.toastr('warning', 'تم رفع البيانات مسبقًا، جار التعديل ...');
        await this.removeEntry(`${path}`);
      }

      await this.firebaseDb.database.ref(`${path}`).set(imageDetails);
      this.swal.toastr('success', 'تم رفع البيانات بنجاح');
      // this.spinner.hide();
    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ اثناء رفع البيانات');
      // this.spinner.hide();
    }
  }

  async insertIntoDb(path: string, value: any) {
    await this.firebaseDb.database.ref(`${path}`).set(value);
  }

  private async checkEntryExists(entryPath: string): Promise<boolean> {
    this.spinner.show();
    if (!entryPath.trim()) {
      this.swal.toastr('error', 'خطأ في عنوان الصورة في قاعدة البيانات');
      this.spinner.hide();
      return false;
    }

    try {
      const snapshot: any = await this.firebaseDb
        .object(entryPath)
        .snapshotChanges()
        .pipe(take(1))
        .toPromise();

      this.spinner.hide();
      return snapshot.payload.exists();
    } catch (error) {
      this.swal.toastr(
        'error',
        'حدث خطأ في فحص عنوان الصورة في قاعدة البيانات'
      );
      this.spinner.hide();
      return false;
    }
  }

  private async removeEntry(entryPath: string): Promise<'removed' | 'error'> {
    this.spinner.show();
    if (!entryPath.trim()) {
      this.swal.toastr('error', 'خطأ في عنوان الصورة في قاعدة البيانات');
      this.spinner.hide();
      return 'error';
    }

    try {
      await this.firebaseDb.object(entryPath).remove();
      this.swal.toastr('success', 'تم حذف الصورة بنجاح');
      this.spinner.hide();
      return 'removed';
    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ اثناء حذف الصورة');
      this.spinner.hide();
      return 'error';
    }
  }

  async getFileUrl(
    folderPath: string,
    fileName: string
  ): Promise<string | null> {
    this.spinner.show();
    const fileRef = this.storage.ref(`${folderPath}/${fileName}`);

    try {
      const downloadUrl = await fileRef.getDownloadURL().toPromise();
      this.swal.toastr('success', 'تم العثور علي الصورة بنجاح');
      this.spinner.hide();
      return downloadUrl;
    } catch (error) {
      this.swal.toastr('error', 'حدث  خطأ اثناء العثور علي الصورة');
      this.spinner.hide();
      return null;
    }
  }
  // Function to check if an image URL is valid
  checkImageUrl(url: string) {
    // Try to fetch the image. If status is 404 or error, image is broken
    return this.http.head(url, { observe: 'response' }).pipe(
      map((response) => response.status === 200),
      // Catch error (e.g., if 404 or unreachable) and return false
      catchError(() => of(false))
    );
  }
}
