import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { SwalService } from './swal.service';

@Injectable({
  providedIn: 'root',
})
export class FireBaseUserService {
  constructor(
    private storage: AngularFireStorage,
    private firebaseDb: AngularFireDatabase,
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) {}

  getDataByPath(path: string): Observable<any> {
    return this.firebaseDb.object(path).valueChanges(); // Fetches data from the specified path
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
      this.swal.toastr('error', 'حدث خطأ اثناء العثور علي الصورة بنجاح');
      this.spinner.hide();
      return null;
    }
  }
}
