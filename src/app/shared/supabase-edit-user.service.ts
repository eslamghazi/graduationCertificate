import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { NgxSpinnerService } from 'ngx-spinner';
import { SwalService } from './swal.service';
import { HttpClient } from '@angular/common/http';
import { catchError, from, map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseEditUserService {
  supabase: SupabaseClient;

  constructor(
    private spinner: NgxSpinnerService,
    private swal: SwalService,
    private http: HttpClient
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  private parsePath(path: string): { classId: string; subClassId: string; id: string } | null {
    const parts = path.split('/');
    if (parts.length !== 3) {
      return null;
    }
    return {
      classId: parts[0],
      subClassId: parts[1],
      id: parts[2],
    };
  }

  getData(classId: string, subClassId: string, id: string): Observable<any> {
    this.spinner.show();
    return from(
      this.supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .eq('subclass_id', subClassId)
        .eq('id', id)
        .order('created_at', { ascending: false })
        .single()
    ).pipe(
      map(({ data, error }) => {
        this.spinner.hide();
        if (error) throw error;
        return data;
      }),
      catchError((error) => {
        this.spinner.hide();
        this.swal.toastr('error', 'Error fetching data');
        return of(null);
      })
    );
  }

  getDataByPath(path: string): Observable<any> {
    const parsed = this.parsePath(path);
    if (!parsed) {
      return of(null);
    }
    const { classId, subClassId, id } = parsed;
    return this.getData(classId, subClassId, id);
  }

  getAllData(path = '/'): Observable<any> {
    let query = this.supabase.from('students').select('*');
    if (path !== '/') {
      const parts = path.split('/');
      if (parts.length >= 1) {
        query = query.eq('class_id', parts[0]);
      }
      if (parts.length >= 2) {
        query = query.eq('subclass_id', parts[1]);
      }
      query.order('created_at', { ascending: false });
    }
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  encryptFileName(filename: string): string {
    const parts = filename.split(".");
    const name = btoa(unescape(encodeURIComponent(parts.slice(0, -1).join("."))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""); // optionally remove padding
    const ext = parts.slice(-1)[0];
    return `${name}.${ext}`;
  }

  async uploadFile(filePath: string, file: File): Promise<string> {
    this.spinner.show();

    try {
      debugger
      // Attempting to upload the file with upsert enabled
      const { data, error } = await this.supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error('Upload error:', error);
        throw error; // This will now log the error and throw it
      }

      // Get the public URL after successful upload
      const { publicUrl } = this.supabase.storage
        .from('images')
        .getPublicUrl(filePath).data;

      const freshUrl = `${publicUrl}?t=${new Date().getTime()}`;
      this.swal.toastr('success', 'تم رفع الصورة بنجاح');
      return freshUrl;

    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ أثناء الرفع');
      console.error('Error during file upload process:', error);
      throw error; // Rethrow error to be caught elsewhere if needed
    } finally {
      this.spinner.hide();
    }
  }


  async insertImageDetails(imageDetails: any, path: string): Promise<void> {
    const parsed = this.parsePath(path);
    if (!parsed) {
      this.swal.toastr('error', 'خطأ في الرقم القومي');
      return;
    }
    const { classId, subClassId, id } = parsed;

    const studentData = {
      id: id,
      class_id: classId,
      subclass_id: subClassId,
      name: imageDetails.name,
      date_of_birth: imageDetails.date_of_birth,
      place_of_birth: imageDetails.place_of_birth,
      image_url: imageDetails.image_url,
      created_at: new Date().toISOString(),
      // Add other fields as necessary based on your table schema
    };

    const { error } = await this.supabase
      .from('students')
      .upsert(studentData, { onConflict: 'id' });
    if (error) {
      this.swal.toastr('error', 'حدث خطأ اثناء رفع البيانات');
      throw error;
    }
    this.swal.toastr('success', 'تم رفع البيانات بنجاح');
  }

  checkImageUrl(url: string): Observable<boolean> {
    return this.http.head(url, { observe: 'response' }).pipe(
      map((response) => response.status === 200),
      catchError(() => of(false))
    );
  }

  async checkImageExists(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking image:', error);
      return false;
    }
  }

  async getDataTable(table: string, filters: any = {}): Promise<any> {
    let query = this.supabase.from(table).select('*');

    // Apply filters if provided
    for (const key in filters) {
      if (filters[key]) {
        query = query.eq(key, filters[key]);
      }
    }

    query.order('created_at', { ascending: false });

    return (await query).data
  }
}
