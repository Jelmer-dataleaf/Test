import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { TaskSearchComponent } from './components/task-search/task-search.component';

export const routes: Routes = [
  { path: '',          redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'tasks',     component: TaskListComponent },
  { path: 'tasks/:id', component: TaskDetailComponent },
  { path: 'search',    component: TaskSearchComponent },
];
