import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

function noWhitespace(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim().length === 0 && control.value !== ''
    ? { whitespace: true }
    : null;
}

function urlOrEmpty(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  if (!v) return null;
  try {
    new URL(v);
    return null;
  } catch {
    return { invalidUrl: true };
  }
}

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.scss',
})
export class ProfileFormComponent {
  submitted = false;

  private fb = inject(FormBuilder);

  form = this.fb.group({
    firstName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50), noWhitespace],
    ],
    lastName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(50), noWhitespace],
    ],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-().]{7,20}$/)]],
    birthDate: ['', [Validators.required]],
    bio: ['', [Validators.maxLength(300)]],
    website: ['', [urlOrEmpty]],
    role: ['', [Validators.required]],
    newsletter: [false],
  });

  get firstName() {
    return this.form.get('firstName')!;
  }
  get lastName() {
    return this.form.get('lastName')!;
  }
  get email() {
    return this.form.get('email')!;
  }
  get phone() {
    return this.form.get('phone')!;
  }
  get birthDate() {
    return this.form.get('birthDate')!;
  }
  get bio() {
    return this.form.get('bio')!;
  }
  get website() {
    return this.form.get('website')!;
  }
  get role() {
    return this.form.get('role')!;
  }
  get newsletter() {
    return this.form.get('newsletter')!;
  }

  get bioLength() {
    return (this.bio.value ?? '').length;
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
