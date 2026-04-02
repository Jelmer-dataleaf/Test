import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface StatCard {
  label: string;
  value: number;
  unit: string;
  testId: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  stats: StatCard[] = [
    { label: 'Tasks', value: 12, unit: 'open', testId: 'stat-tasks', route: '/tasks' },
    { label: 'Feedback', value: 5, unit: 'responses', testId: 'stat-feedback', route: '/feedback' },
    {
      label: 'Newsletter',
      value: 38,
      unit: 'subscribers',
      testId: 'stat-newsletter',
      route: '/newsletter',
    },
    { label: 'Users', value: 7, unit: 'registered', testId: 'stat-users', route: '/register' },
  ];
}
