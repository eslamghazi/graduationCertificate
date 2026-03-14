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
    this.checkAdminAndLoadSettings();
  }

  checkAdminAndLoadSettings() {
    // 1. Ensure admin exists (get NID from local storage)
    const adminCheck = localStorage.getItem('adminCheck');
    const adminNid = adminCheck?.split('-')[1];

    if (adminCheck && adminNid) {
      // Check if we have settings in sessionStorage
      const sessionSettings = sessionStorage.getItem('app_settings');
      if (sessionSettings) {
        const settings = JSON.parse(sessionSettings);
        this.userData = settings.userData;
        this.comingSoon = settings.comingSoon;
        // Optionally update localStorage currentClass if needed elsewhere
        localStorage.setItem('currentClass', settings.currentClass);
      } else {
        // Fetch and initialize
        this.fetchAndCacheSettings(adminNid, adminCheck.split('-')[0]);
      }
    } else {
      // If no admin, clear and check comingSoon
      localStorage.removeItem('adminCheck');
      sessionStorage.removeItem('app_settings');
      this.loadComingSoonOnly();
    }
  }

  private fetchAndCacheSettings(adminNid: string, authLevel: string) {
    this.supabaseAuthService.getDataByPath(`auth/${adminNid}`).subscribe((userData) => {
      if (userData) {
        this.userData = userData;

        // Handle superadmin setting
        if (authLevel === 'superadmin' || userData.auth_level === 'superadmin' || adminNid === environment.authorize) {
          this.comingSoon = true;
          localStorage.setItem('adminCheck', `superadmin-${adminNid}`);
        } else {
          localStorage.setItem('adminCheck', `${userData.auth_level}-${userData.id}`);
        }

        // Fetch classes and other global settings
        this.supabaseAuthService.getDataByPath('classes').subscribe((classData) => {
          if (classData) {
            const userClass = userData.class_id;
            let finalClass = classData[userClass] ? userClass : null;

            // Fetch global settings
            this.supabaseAuthService.getDataByPath('settings/view_status').subscribe((viewStatusData) => {
              const viewStatus = viewStatusData?.value || 'edit';

              if (finalClass) {
                this.finalizeSession(userData, finalClass, viewStatus);
              } else {
                // Fallback to default class from settings
                this.supabaseAuthService.getDataByPath('settings/default_class').subscribe((defaultClass) => {
                  finalClass = defaultClass?.value || classData.default_class;
                  this.finalizeSession(userData, finalClass, viewStatus);
                });
              }
            });
          }
        });
      } else {
        localStorage.removeItem('adminCheck');
        this.loadComingSoonOnly();
      }
    });
  }

  private finalizeSession(userData: any, currentClass: string, viewStatus: string) {
    if (currentClass) {
      localStorage.setItem('currentClass', currentClass);
    }

    // Save all to sessionStorage
    const settings = {
      userData: userData,
      currentClass: currentClass,
      comingSoon: this.comingSoon,
      viewStatus: viewStatus,
      timestamp: new Date().getTime()
    };
    sessionStorage.setItem('app_settings', JSON.stringify(settings));
  }

  private loadComingSoonOnly() {
    this.supabaseAuthService.getDataByPath('settings/coming_soon').subscribe((comingSoonData) => {
      if (comingSoonData) {
        this.comingSoon = comingSoonData.value === 'true';
      }
      this.supabaseAuthService.getDataByPath('settings/view_status').subscribe((viewStatusData) => {
        const settings = {
          comingSoon: this.comingSoon,
          viewStatus: viewStatusData?.value || 'edit',
          timestamp: new Date().getTime()
        };
        sessionStorage.setItem('app_settings', JSON.stringify(settings));
      });
    });
  }
}
