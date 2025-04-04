import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, from } from 'rxjs';
import { SwalService } from './swal.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseUserService {
  private supabase: SupabaseClient;

  constructor(
    private spinner: NgxSpinnerService,
    private swal: SwalService
  ) {
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
          .single()
          .then(response => response.data)
      );
    }
    return from(
      this.supabase
        .from(table)
        .select('*')
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
          .single()
          .then(response => response.data)
      );
    }
    return from(
      this.supabase
        .from("students")
        .select('*')
        .then(response => response.data)
    );
  }

  async getFileUrl(folderPath: string, fileName: string): Promise<string | null> {
    this.spinner.show();
    try {
      const { data } = this.supabase
        .storage
        .from('images')
        .getPublicUrl(`${folderPath}/${fileName}`);

      // Check if the URL is valid (optional, depending on your needs)
      if (!data.publicUrl) {
        throw new Error('No public URL returned');
      }

      this.swal.toastr('success', 'تم العثور علي الصورة بنجاح');
      this.spinner.hide();
      return data.publicUrl;
    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ اثناء العثور علي الصورة بنجاح');
      this.spinner.hide();
      return null;
    }
  }
}
