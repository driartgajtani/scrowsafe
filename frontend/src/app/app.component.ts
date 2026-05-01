import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { TidioService } from './core/services/tidio.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 64px);
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `],
})
export class AppComponent implements OnInit {
  constructor(
    private tidioService: TidioService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.tidioService.load().then(() => {
      const user = this.authService.user();
      if (user) {
        this.tidioService.identifyUser(user);
      }
    });
  }
}
