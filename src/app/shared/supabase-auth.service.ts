import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseAuthService {
  supabase: SupabaseClient;

  constructor() {

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

  }

  getDataByPath(path: string): Observable<any> {

    const pathParts = path.split('/');
    const basePath = pathParts[0];
    const subPath = pathParts[1];

    if (basePath === 'auth' && subPath) {
      // Fetch a single auth record by NationalId
      return from(
        this.supabase
          .from('auth')
          .select('*')
          .eq('id', subPath)
          .order('created_at', { ascending: false })
          .single()
      ).pipe(
        map((response: any) => {
          if (response.error) {
            throw new Error(response.error.message);
          }
          return response.data;
        }),
        catchError((error) => {
          console.error(`Error fetching auth data for path ${path}:`, error);
          return of(null);
        })
      );
    } else if (basePath === 'classes') {
      // Fetch all classes and return them as an object
      return from(
        this.supabase
          .from('classes')
          .select('*')
          .order('created_at', { ascending: false })
      ).pipe(
        map((response: any) => {
          if (response.error) {
            throw new Error(response.error.message);
          }
          // Convert the array of classes into an object for compatibility with Firebase structure
          const classesObj: { [key: string]: any } = {};
          response.data.forEach((cls: any) => {
            classesObj[cls.id] = cls;
          });
          // Add the default_class property
          const defaultClass = response.data.find((cls: any) => cls.default_class) || response.data[0];
          classesObj['default_class'] = defaultClass ? defaultClass.id : null;
          return classesObj;
        }),
        catchError((error) => {
          console.error(`Error fetching classes for path ${path}:`, error);
          return of(null);
        })
      );
    } else if (basePath === 'settings' && subPath) {
      // Fetch a setting by key (e.g., "comingSoon")
      return from(
        this.supabase
          .from('settings')
          .select('*')
          .eq('id', subPath)
          .order('created_at', { ascending: false })
          .single()
      ).pipe(
        map((response: any) => {
          if (response.error) {
            throw new Error(response.error.message);
          }
          return response.data;
        }),
        catchError((error) => {
          console.error(`Error fetching setting for path ${path}:`, error);
          return of(null);
        })
      );
    }

    return of(null); // Return null for unsupported paths
  }

  // Rest of the methods (getAuthData, insertIntoDb, etc.) remain unchanged
  getAuthData(path: string): Observable<any[]> {
    const classId = path.split('/').pop();
    if (!classId) {
      return of([]);
    }

    return from(
      this.supabase
        .from('auth')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data.map((record: any) => ({
          key: record.id,
          data: record,
        }));
      }),
      catchError((error) => {
        console.error(`Error fetching auth data for path ${path}:`, error);
        return of([]);
      })
    );
  }

  async insertIntoDb(path: string, value: any): Promise<void> {
    const nationalId = path.split('/').pop();
    if (!nationalId) {
      throw new Error('Invalid path: NationalId not found');
    }

    const authData = {
      id: nationalId,
      name: value.Name || '',
      auth_level: value.Auth || 'user',
      class_id: value.ClassId || null,
    };

    const { error } = await this.supabase
      .from('auth')
      .upsert(authData, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting data at path ${path}:`, error);
      throw new Error(error.message);
    }
  }

  async removeImagePropertyFromDatabase(
    dbPath: string,
    deleteState: string
  ): Promise<void> {
    const nationalId = dbPath.split('/').pop();
    if (!nationalId) {
      throw new Error('Invalid path: NationalId not found');
    }

    if (deleteState === 'deleteAll') {
      const { error } = await this.supabase
        .from('auth')
        .delete()
        .eq('id', nationalId);

      if (error) {
        console.error(`Error deleting auth record at path ${dbPath}:`, error);
        throw new Error(error.message);
      }
    } else {
      throw new Error('removeImagePropertyFromDatabase is not applicable for auth table');
    }
  }
}
