import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseSettingsService {
  supabase: SupabaseClient;
  private currentClass = localStorage.getItem('currentClass');

  constructor() {

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

  }

  // Fetch data from a specific table
  getDataByPath(table: string, filters: any = {}): Observable<any> {
    let query = this.supabase.from(table).select('*');

    // Apply filters if provided
    for (const key in filters) {
      if (filters[key]) {
        query = query.eq(key, filters[key]);
      }
    }

    return from(query).pipe(
      map((response: any) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data;
      }),
      catchError((error) => {
        console.error(`Error fetching data from ${table}:`, error);
        return of(null);
      })
    );
  }

  // Insert or update data in a table
  async insertIntoDb(table: string, value: any, upsert = false): Promise<void> {
    try {
      const { error } = upsert
        ? await this.supabase.from(table).upsert(value)
        : await this.supabase.from(table).insert(value);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error(`Error pushing ${this.currentClass} data:`, error);
      throw error;
    }
  }

  // Push class data (specific to the classes table)
  async pushClassData(classData: any, table: string = 'classes'): Promise<void> {
    try {
      await this.insertIntoDb(table, classData, true); // Use upsert to update if exists
    } catch (error) {
      console.error(`Error pushing ${this.currentClass} data:`, error);
      throw error;
    }
  }

  // Remove or update a specific field (e.g., image_url)
  async removeImagePropertyFromDatabase(
    table: string,
    id: string,
    deleteState: string
  ): Promise<void> {
    try {
      if (deleteState === 'deleteAll') {
        const { error } = await this.supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await this.supabase
          .from(table)
          .update({ image_url: null })
          .eq('id', id);
        if (error) throw new Error(error.message);
      }
    } catch (error) {
      console.error(`Error removing image property from ${table}:`, error);
      throw error;
    }
  }
}
