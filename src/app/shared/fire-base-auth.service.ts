import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from './swal.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FireBaseAuthService {
  constructor(private firebaseDb: AngularFireDatabase) {}

  getDataByPath(path: string): Observable<any> {
    return this.firebaseDb.object(path).valueChanges(); // Fetches data from the specified path
  }

  getAuthData(path: string) {
    return this.firebaseDb
      .object(path)
      .valueChanges()
      .pipe(
        map((data: any) => {
          // If data is an object, convert it into an array
          if (data && typeof data === 'object') {
            return Object.keys(data).map((key) => ({
              key: key,
              data: data[key],
            }));
          }
          return [];
        })
      );
  }

  async insertIntoDb(path: string, value: any) {
    await this.firebaseDb.database.ref(`${path}`).set(value);
  }

  addEditDataToObject(path: string, data: any) {
    const itemRef = this.firebaseDb.object(path);
    return itemRef.update(data);
  }

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
}
