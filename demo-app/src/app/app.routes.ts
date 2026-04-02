import { Routes } from '@angular/router';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { TaskSearchComponent } from './components/task-search/task-search.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { MemePageComponent } from './components/meme-page/meme-page.component';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { FeedbackFormComponent } from './components/feedback-form/feedback-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'tasks', component: TaskListComponent },
  { path: 'tasks/:id', component: TaskDetailComponent },
  { path: 'search', component: TaskSearchComponent },
  { path: 'contact', component: ContactFormComponent },
  { path: 'meme', component: MemePageComponent },
  { path: 'register', component: RegisterFormComponent },
  { path: 'feedback', component: FeedbackFormComponent },
];
