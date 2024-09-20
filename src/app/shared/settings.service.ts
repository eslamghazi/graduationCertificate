import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private firebaseDb: AngularFireDatabase) { }

  getDataByPath(path: string): Observable<any> {
    return this.firebaseDb.object(path).valueChanges(); // Fetches data from the specified path
  }

  async pushClassData(classData: any, object: any = '/'): Promise<void> {
    try {
      await this.firebaseDb.object(object).set(classData);
      return console.log('Class2024Internship data pushed successfully');
    } catch (error) {
      return console.error('Error pushing Class2024Internship data:', error);
    }
  }
}
