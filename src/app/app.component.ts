import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library'
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';
import { AuthComponent } from "./auth/auth.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'scan-gate';

}
