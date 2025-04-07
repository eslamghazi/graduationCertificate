import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseUserService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey, {
        auth: {
          autoRefreshToken: false, // Disable auto-refresh to avoid lock attempts
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  getDataByPath(table: string, id?: string): Observable<any> {
    if (id) {
      return from(
        this.supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .order('created_at', { ascending: false })
          .single()
          .then(response => response.data)
      );
    }
    return from(
      this.supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .then(response => response.data)
    );
  }

  getStudentForEditAuth(classNumber: string, subClassNumber: string, id: string): Observable<any> {
    if (id) {
      return from(
        this.supabase
          .from("students")
          .select('*')
          .eq('class_id', classNumber)
          .eq('subclass_id', subClassNumber)
          .eq('id', id)
          .order('created_at', { ascending: false })
          .single()
          .then(response => response.data)
      );
    }
    return from(
      this.supabase
        .from("students")
        .select('*')
        .order('created_at', { ascending: false })
        .then(response => response.data)
    );
  }

}
