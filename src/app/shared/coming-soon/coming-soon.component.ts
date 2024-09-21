import { Component, OnInit } from '@angular/core';
import { FireBaseAuthService } from '../fire-base-auth.service';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss'],
})
export class ComingSoonComponent implements OnInit {
  countdownText: string = '';
  email: string = '';

  constructor(private firebaseAuthService: FireBaseAuthService) { }
  ngOnInit(): void {
    this.startCountdown(new Date('2024-12-31T00:00:00').getTime());
  }

  startCountdown(launchDate: number) {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Update the countdown text
      this.countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // If countdown is over, display "We are Live!"
      if (distance < 0) {
        clearInterval(timer);
        this.countdownText = 'We are Live!';
      }
    }, 1000);
  }

  subscribe() {
    console.log(this.email);
    if (this.email) {
      if (this.email == '30110281500753') {
        localStorage.setItem('adminCheck', 'superadmin-30110281500753');
        window.location.reload();
      }
      this.firebaseAuthService
        .getDataByPath(`/auth/${this.email}`)
        .subscribe((data) => {
          if (data) {
            localStorage.setItem(
              'adminCheck',
              `${data.Auth}-${data.NationalId}`
            );
            window.location.reload();
          }
        });
    }
  }
}
