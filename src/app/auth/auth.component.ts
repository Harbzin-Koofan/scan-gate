import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { confirmResetPassword, confirmSignUp, fetchUserAttributes, resendSignUpCode, resetPassword, signIn, signUp, updatePassword, updateUserAttributes, type UpdateUserAttributesOutput } from "aws-amplify/auth";
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { } from '@angular/material/progress-bar';


@Component({
  selector: 'app-auth',
  imports: [MatProgressBarModule, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  isLogin = true
  isSignUp = false
  isVerifyAccount = false
  isLoading = false
  loginFormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.min(8)])
  })
  confirmFormGroup = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.min(6)]),
  })

  signUpFormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.min(8)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.min(8)]),
    firstName: new FormControl('', [Validators.required, Validators.min(3)]),
    lastName: new FormControl('', [Validators.required, Validators.min(3)]),
  })

  constructor(private router: Router, private snackBar: MatSnackBar) { }

  async login() {
    if (this.loginFormGroup.valid) {
      try {
        this.isLoading = true
        console.log(this.loginFormGroup.value)
        const signInProfileResponse = await signIn({
          username: this.loginFormGroup.controls.email.value!,
          password: this.loginFormGroup.controls.password.value!,
        })
        this.isLoading = false
        if (signInProfileResponse.nextStep.signInStep = 'DONE') {
          this.router.navigateByUrl('/generate-tickets')
        }
      } catch (e: any) {
        this.snackBar.open(e.message, 'Done')
        this.isLoading = false
      }
    }
  }

  async onSignUp() {
    if (this.signUpFormGroup.valid && (this.signUpFormGroup.controls.password.value == this.signUpFormGroup.controls.confirmPassword.value)) {
      try {
        this.isLoading = true
        console.log(this.signUpFormGroup.value)
        const { nextStep } = await signUp({
          username: this.signUpFormGroup.controls.email.value!,
          password: this.signUpFormGroup.controls.password.value!,
          options: {
            userAttributes: {
              given_name: this.signUpFormGroup.controls.firstName.value!,
              family_name: this.signUpFormGroup.controls.lastName.value!
            }
          }
        })
        this.isLoading = false

        if (nextStep.signUpStep == 'CONFIRM_SIGN_UP') {
          this.isVerifyAccount = true
          this.isLogin = false
          this.isSignUp = false
          this.snackBar.open('Account created successfully, verification needed', 'Done')
        }
      } catch (e: any) {
        this.snackBar.open(e.message, 'Done')
        console.log(e)
        this.isLoading = false
      }
    }
  }

  async verifyAccount() {
    if (this.confirmFormGroup.valid) {
      try {
        this.isLoading = true
        console.log(this.confirmFormGroup.value)
        const { isSignUpComplete, nextStep } = await confirmSignUp({
          username: this.signUpFormGroup.controls.email.value!,
          confirmationCode: String(this.confirmFormGroup.controls.code.value)
        });

        if (nextStep.signUpStep == 'DONE') {
          this.isLogin = true
          this.isSignUp = false
          this.isVerifyAccount = false
          this.snackBar.open('Account verified successfully', 'Done')
        }
        this.isLoading = false
      } catch (e: any) {
        this.snackBar.open(e.message, 'Done')
        this.isLoading = false
      }
    }
  }
}
