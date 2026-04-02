import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  submitted = false;
  showPassword = false;

  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  get username() {
    return this.form.get('username')!;
  }
  get password() {
    return this.form.get('password')!;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
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
    this.showPassword = false;
  }
}
