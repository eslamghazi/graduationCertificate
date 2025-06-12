import { Component, OnInit, OnDestroy } from '@angular/core';
import { SupabaseAuthService } from '../supabase-auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss'],
})
export class ComingSoonComponent implements OnInit, OnDestroy {
  countdownText: string = '';
  email: string = '';
  private timer: any; // Store the timer ID

  constructor(private supabaseAuthService: SupabaseAuthService) {}

  ngOnInit(): void {
    this.startCountdown(new Date('2025-12-31T00:00:00').getTime());
  }

  startCountdown(launchDate: number) {
    this.timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      this.countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      if (distance < 0) {
        clearInterval(this.timer);
        this.countdownText = 'We are Live!';
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    // Clear the timer when the component is destroyed
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  subscribe() {
    if (this.email) {
      if (this.email.toLowerCase() === `auth-${environment.authorize}`) {
        localStorage.setItem('adminCheck', `superadmin-${environment.authorize}`);
        window.location.reload();
        return;
      }
debugger
      const nationalId = this.email.split('-')[1];
      if (this.email.split('-')[0].toLowerCase() === 'auth' && nationalId) {
        this.supabaseAuthService.getDataByPath(`auth/${nationalId}`).subscribe((data: any) => {
          if (data) {
            localStorage.setItem(
              'adminCheck',
              `${data.auth_level}-${data.id}`
            );
            window.location.reload();
          }
        });
      }
    }
  }
}
