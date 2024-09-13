import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize, Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FireBaseEditUserService {
  constructor(
    private firebaseDb: AngularFireDatabase,
    private storage: AngularFireStorage
  ) {}

  getDataByPath(path: string): Observable<any> {
    return this.firebaseDb.object(path).valueChanges(); // Fetches data from the specified path
  }

  getAllData(path = '/'): Observable<any> {
    return this.firebaseDb.list(path).valueChanges();
  }

  async uploadToStorage(
    filePath: string,
    selectedImage: File,
    formValues: any
  ): Promise<void> {
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
                  console.log('File uploaded successfully, URL:', url);

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
                  console.error('Error fetching download URL:', error);
                  reject(error); // Reject if getting the URL fails
                }
              );
            })
          )
          .subscribe({
            error: (error) => {
              console.error('Error during upload:', error);
              reject(error); // Reject if there's an error during the upload
            },
          });
      });
    } catch (error) {
      console.error('Upload failed:', error);
      throw error; // Rethrow the error to handle it in calling code if needed
    }
  }

  async insertImageDetails(imageDetails: any, path: any): Promise<void> {
    if (!path) {
      console.error('Invalid NationalId:', imageDetails.NationalId);
      return;
    }

    try {
      const entryExists = await this.checkEntryExists(path);

      if (entryExists) {
        console.log(
          `Entry already exists for NationalId: ${path}, removing...`
        );
        await this.removeEntry(`${path}`);
      }

      await this.firebaseDb.database.ref(`${path}`).set(imageDetails);
      console.log('Inserted image details for NationalId:', path);
    } catch (error) {
      console.error('Error inserting image details:', error);
    }
  }

  private async checkEntryExists(entryPath: string): Promise<boolean> {
    if (!entryPath.trim()) {
      console.error('Invalid path for checking existence:', entryPath);
      return false;
    }

    try {
      const snapshot: any = await this.firebaseDb
        .object(entryPath)
        .snapshotChanges()
        .pipe(take(1))
        .toPromise();

      return snapshot.payload.exists();
    } catch (error) {
      console.error(
        'Error checking entry existence at path:',
        entryPath,
        error
      );
      return false;
    }
  }

  private async removeEntry(entryPath: string): Promise<'removed' | 'error'> {
    if (!entryPath.trim()) {
      console.error('Invalid path for removal:', entryPath);
      return 'error';
    }

    try {
      await this.firebaseDb.object(entryPath).remove();
      console.log('Entry removed at path:', entryPath);
      return 'removed';
    } catch (error) {
      console.error('Error removing entry at path:', entryPath, error);
      return 'error';
    }
  }

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
