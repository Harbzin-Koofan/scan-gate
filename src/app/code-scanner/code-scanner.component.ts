import { Component } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
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

  constructor(private router:Router){}

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  async success(guid: string) {
    console.log(guid)
    if (!this.hideScanner) {
      this.isLoading = true
      this.hideScanner = true
      const client = generateClient<Schema>();
      // get a specific item
      this.subscription = client.models.Todo.observeQuery({
        filter: {
          guid: { eq: guid }
        }
      }).subscribe(async r => {
        console.log(r.items)
        if (r.items) {
          if (r.items.length > 0) {
            if (!r.items[0].hasEntered) {
              const client = generateClient<Schema>();

              const { errors, data: result } = await client.models.Todo.update({
                id: r.items[0].id,
                hasEntered: true,
              })

              if (result) {
                console.log('Can Enter')
                this.canEnter = true
              } else {
                alert('Something went wrong')
              }
            } else {
              console.log('Already used')
              this.alreadyUsed = true
            }
          } else {
            console.log('Cannot Enter')
            // this.cannotEnter = true
          }
        } else {
          console.log('Cannot Enter')
          // this.cannotEnter = true
        }
        this.hideScanner = false
        this.scannerStarted = false
        this.isLoading = false
      });
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

  back(){
    this.scannerStarted = false
    this.canEnter = false
    this.cannotEnter = false
    this.alreadyUsed = false
    this.router.navigateByUrl('/')
  }
}
