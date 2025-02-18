import { Component } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-code-scanner',
  imports: [ZXingScannerModule, MatButtonModule, MatProgressBarModule, MatIconModule],
  templateUrl: './code-scanner.component.html',
  styleUrl: './code-scanner.component.css'
})
export class CodeScannerComponent {
  formats = [BarcodeFormat.QR_CODE]
  entrance = true
  hideScanner = false
  scannerStarted = true //TODO: change this to false
  canEnter = false
  cannotEnter = false
  alreadyUsed = false
  isLoading = false
  subscription!: Subscription

  constructor(private router: Router) { }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  async success(guid: string) {
    console.log(guid)
    let x = 0
    if (!this.hideScanner) {
      this.isLoading = true
      this.hideScanner = true
      const client = generateClient<Schema>();
      // get a specific item
      const { data: todos, errors } = await client.models.Todo.list({
        filter: {
          guid: { eq: guid }
        },
        limit: 500
      });

      if (todos) {
        if (todos.length > 0) {
          if (!todos[0].hasEntered) {
            const client = generateClient<Schema>();

            const { errors, data: result } = await client.models.Todo.update({
              id: todos[0].id,
              hasEntered: true,
            })

            if (result) {
              console.log('Can Enter')
              this.canEnter = true
              this.isLoading = false
              this.hideScanner = false
            } else {
              alert('Something went wrong')
            }
          } else {
            console.log('Already used')
            this.alreadyUsed = true
            this.isLoading = false
            this.hideScanner = false
          }
        } else {
          console.log('Invalid Ticket', todos, errors)
          this.cannotEnter = true
          this.isLoading = false
          this.hideScanner = false
        }
      } else {
        console.log('Invalid Ticket ', todos, errors)
        this.cannotEnter = true
        this.isLoading = false
        this.hideScanner = false
      }
      this.scannerStarted = false
    }

  }

  failer(event: any) {
    console.error('Failer: ' + event)
  }
  error(event: any) {
    console.error('Error: ' + event)
  }

  nextScan() {
    this.scannerStarted = true
    this.canEnter = false
    this.cannotEnter = false
    this.alreadyUsed = false
  }

  back() {
    this.scannerStarted = false
    this.canEnter = false
    this.cannotEnter = false
    this.alreadyUsed = false
    this.router.navigateByUrl('/')
  }
}
