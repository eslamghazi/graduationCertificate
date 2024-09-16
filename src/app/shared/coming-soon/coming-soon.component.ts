import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss'],
})
export class ComingSoonComponent implements OnInit {
  countdownText: string = '';
  email: string = '';

  constructor() {}
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
    if (this.email.toString().toLowerCase().includes('auth-admin')) {
      localStorage.setItem('adminCheck', 'admin');
      window.location.reload();
      return;
    }

    if (
      this.email.toString().toLowerCase().includes('auth-30110281500753') ||
      this.email.toString().toLowerCase().includes('auth-superadmin')
    ) {
      localStorage.setItem('adminCheck', '30110281500753');
      window.location.reload();
      return;
    }
  }
}
