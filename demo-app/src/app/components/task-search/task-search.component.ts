import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { Task }              from '../../models/task.model';
import { TaskService }       from '../../services/task.service';

@Component({
  selector: 'app-task-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-search.component.html',
  styleUrl: './task-search.component.scss',
})
export class TaskSearchComponent implements OnInit {
  query       = '';
  allTasks:      Task[] = [];
  filteredTasks: Task[] = [];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getTasks().subscribe((tasks) => {
      this.allTasks      = tasks;
      this.filteredTasks = tasks;
    });
  }

  search(): void {
    const q = this.query.toLowerCase().trim();
    this.filteredTasks = q
      ? this.allTasks.filter((t) => t.title.toLowerCase().includes(q))
      : this.allTasks;
  }

  clearSearch(): void {
    this.query         = '';
    this.filteredTasks = this.allTasks;
  }
}
