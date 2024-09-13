import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root',
})
export class FireBaseUserService {
  constructor(
    private firebaseDb: AngularFireDatabase,
    private storage: AngularFireStorage
  ) {}

  async getFileUrl(
    folderPath: string,
    fileName: string
  ): Promise<string | null> {
    const fileRef = this.storage.ref(`${folderPath}/${fileName}`);

    try {
      const downloadUrl = await fileRef.getDownloadURL().toPromise();
      console.log('File found:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('File not found or error occurred:', error);
      return null;
    }
  }
}
