import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FireBaseAdminService {
  constructor(private firebaseDb: AngularFireDatabase, private storage: AngularFireStorage) {}

  getAllData(path = '/'): Observable<any> {
    return this.firebaseDb.list(path).valueChanges();
  }


  listFiles(path: string): Observable<any> {
    return new Observable(observer => {
      const storageRef = this.storage.ref(path);
      storageRef.listAll().subscribe(result => {
        observer.next(result.items);
        observer.complete();
      }, error => {
        observer.error(error);
      });
    });
  }

  // Get download URL for a file
  getFileUrl(path: string): Observable<string> {
    const fileRef = this.storage.ref(path);
    return fileRef.getDownloadURL();
  }

}
