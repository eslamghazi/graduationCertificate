import { Component, OnInit } from '@angular/core';
import { SupabaseAuthService } from './shared/supabase-auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  auth = localStorage.getItem('adminCheck');
  authPrevilige = localStorage.getItem('adminCheck')?.split('-')[1];
  comingSoon = false;
  userData: any;

  constructor(private supabaseAuthService: SupabaseAuthService) {}

  ngOnInit(): void {
    this.getAuth();
  }

  getAuth() {
    if (this.auth && this.authPrevilige) {
      // Fetch the user's auth data
      this.supabaseAuthService
        .getDataByPath(`auth/${this.authPrevilige}`)
        .subscribe((userData) => {
          if (userData) {
            this.userData = userData;
            // Handle superadmin case
            if (this.authPrevilige === environment.authorize) {
              this.comingSoon = true;
              localStorage.setItem('adminCheck', `superadmin-${environment.authorize}`);

              // Fetch class data to set currentClass
              this.supabaseAuthService
                .getDataByPath('classes')
                .subscribe((classData) => {
                  if (classData) {
                    const userClass = userData.class_id;
                    if (classData[userClass]) {
                      localStorage.setItem('currentClass', userClass);
                    } else {

                      this.supabaseAuthService
                .getDataByPath('settings')
                .subscribe((settingsData) => {
                  if (settingsData) {
                    localStorage.setItem('currentClass', settingsData.find((x: any) => x.id === 'default_class').value);
                  }
                });

                    }
                  }
                });
              return;
            }

            // Update adminCheck with the user's auth_level and id
            localStorage.setItem(
              'adminCheck',
              `${userData.auth_level}-${userData.id}`
            );

            // Fetch class data to set currentClass
            this.supabaseAuthService
              .getDataByPath('classes')
              .subscribe((classData) => {
                if (classData) {
                  const userClass = userData.class_id;
                  if (classData[userClass]) {
                    localStorage.setItem('currentClass', userClass);
                  } else {
                    this.supabaseAuthService
              .getDataByPath('settings')
              .subscribe((settingsData) => {
                if (settingsData) {
                  localStorage.setItem('currentClass', settingsData.find((x: any) => x.id === 'default_class').value);
                }
              });

                  }
                }
              });
          } else {
            // If user data doesn't exist, clear adminCheck
            localStorage.removeItem('adminCheck');
          }
        });
    } else {
      // If no auth, check the comingSoon setting
      this.supabaseAuthService
        .getDataByPath('settings/coming_soon')
        .subscribe((data) => {
          if (data) {
            data.value === "true" ? (this.comingSoon = true) : (this.comingSoon = false);
          }
        });
    }
  }
}
