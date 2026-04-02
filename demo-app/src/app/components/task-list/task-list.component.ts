import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  newTitle = '';
  newPriority: Task['priority'] = 'medium';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getTasks().subscribe((tasks) => (this.tasks = tasks));
  }

  addTask(): void {
    if (!this.newTitle.trim()) return;
    this.taskService.addTask(this.newTitle, this.newPriority);
    this.newTitle = '';
  }

  toggle(id: number): void {
    this.taskService.toggleComplete(id);
  }

  delete(id: number): void {
    this.taskService.deleteTask(id);
  }

  trackById(_: number, task: Task): number {
    return task.id;
  }
}
