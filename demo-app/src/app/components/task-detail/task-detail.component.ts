import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Task }        from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit {
  task: Task | undefined;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.task = this.taskService.getById(id);
    this.notFound = !this.task;
  }

  toggle(): void {
    if (this.task) {
      this.taskService.toggleComplete(this.task.id);
      this.task = this.taskService.getById(this.task.id);
    }
  }
}
