import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasks: Task[] = [
    { id: 1, title: 'Set up Angular project', completed: true,  priority: 'high'   },
    { id: 2, title: 'Write unit tests',        completed: false, priority: 'high'   },
    { id: 3, title: 'Configure Playwright',    completed: false, priority: 'medium' },
    { id: 4, title: 'Deploy to staging',       completed: false, priority: 'low'    },
  ];

  private readonly tasks$ = new BehaviorSubject<Task[]>(this.tasks);

  getTasks(): Observable<Task[]> {
    return this.tasks$.asObservable();
  }

  getById(id: number): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  addTask(title: string, priority: Task['priority'] = 'medium'): Task {
    const task: Task = {
      id: Date.now(),
      title: title.trim(),
      completed: false,
      priority,
    };
    this.tasks = [...this.tasks, task];
    this.tasks$.next(this.tasks);
    return task;
  }

  toggleComplete(id: number): void {
    this.tasks = this.tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    this.tasks$.next(this.tasks);
  }

  deleteTask(id: number): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.tasks$.next(this.tasks);
  }
}
