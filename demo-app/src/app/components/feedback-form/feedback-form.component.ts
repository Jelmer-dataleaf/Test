import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.scss',
})
export class FeedbackFormComponent {
  submitted = false;

  categories = ['Bug Report', 'Feature Request', 'General Feedback', 'Other'];

  private fb = inject(FormBuilder);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    category: ['', Validators.required],
    rating: [null as number | null, [Validators.required, Validators.min(1), Validators.max(5)]],
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(80)]],
    feedback: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
  });

  constructor() {}

  get fullName() {
    return this.form.get('fullName')!;
  }
  get email() {
    return this.form.get('email')!;
  }
  get category() {
    return this.form.get('category')!;
  }
  get rating() {
    return this.form.get('rating')!;
  }
  get subject() {
    return this.form.get('subject')!;
  }
  get feedback() {
    return this.form.get('feedback')!;
  }

  get feedbackLength() {
    return (this.feedback.value ?? '').length;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted = true;
  }

  reset() {
    this.form.reset();
    this.submitted = false;
  }
}
