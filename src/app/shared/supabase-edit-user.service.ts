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

  async getDataByPathPromise(path: string): Promise<any> {
    const parsed = this.parsePath(path);
    if (!parsed) {
      return null;
    }
    const { classId, subClassId, id } = parsed;
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('subclass_id', subClassId)
      .eq('id', id)
      .single();
    if (error) {
      throw error;
    }
    return data;
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
    }
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  async uploadFile(filePath: string, file: File): Promise<string> {
    this.spinner.show();

    try {
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

  async getFileUrl(folderPath: string, fileName: string): Promise<string | null> {
    this.spinner.show();
        try {
      const { data } = this.supabase.storage
        .from('images')
        .getPublicUrl(`${folderPath}/${fileName}`);
      this.swal.toastr('success', 'تم العثور علي الصورة بنجاح');
      return data.publicUrl;
    } catch (error) {
      this.swal.toastr('error', 'حدث خطأ اثناء العثور علي الصورة');
      return null;
    } finally {
      this.spinner.hide();
    }
  }

  checkImageUrl(url: string): Observable<boolean> {
    return this.http.head(url, { observe: 'response' }).pipe(
      map((response) => response.status === 200),
      catchError(() => of(false))
    );
  }

  async isExists(path: string): Promise<boolean> {
    return  (await this.supabase.storage.from("images").exists(path)).data
  }

  async getDataTable(table: string, filters: any = {}): Promise<any> {
    let query = this.supabase.from(table).select('*');

    // Apply filters if provided
    for (const key in filters) {
      if (filters[key]) {
        query = query.eq(key, filters[key]);
      }
    }

    return (await query).data
  }
}
