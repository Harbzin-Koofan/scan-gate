import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../amplify/data/resource'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { QRCodeComponent } from 'angularx-qrcode';
import { CommonModule, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';


@Component({
  selector: 'app-code-generator',
  imports: [MatProgressBarModule, QRCodeComponent, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  providers: [DatePipe],
  templateUrl: './code-generator.component.html',
  styleUrl: './code-generator.component.css'
})
export class CodeGeneratorComponent {
  numberOfTicketsCtr = new FormControl(0, [Validators.required, Validators.min(1)])
  public qrDataList: string[] = [];
  isForAdult = true
  isTicketsGenerated = false
  isLoading = false

  @ViewChildren('qrCanvas') qrCanvasList!: QueryList<ElementRef>;

  constructor(private datePipe: DatePipe) { }

  async generateTicketsCodes() {
    this.isLoading = true
    for (let i = 0; i < this.numberOfTicketsCtr.value!; i++) {
      const output = await this.insertUUID()
      if (output.data) {
        const result = output.data
        this.qrDataList.push(result.guid!)
      }
    }
    this.isTicketsGenerated = true
    this.isLoading = false
  }

  async downloadOutputZip() {
    if (this.numberOfTicketsCtr.valid) {
      const zip = new JSZip();
      let ticketImageUrl
      let xPosition
      let yPosition

      if(this.isForAdult){
        ticketImageUrl = 'adults.png';
        xPosition = 68
        yPosition = 166
      }else {
        ticketImageUrl = 'kids.png';
        xPosition = 0
        yPosition = 0
      }

      for (let i = 0; i < this.qrDataList.length; i++) {
        const qrCodeElement = this.qrCanvasList.toArray()[i] as any;
        console.log(this.qrCanvasList.length)
        const qrCanvas = qrCodeElement.qrcElement.nativeElement.children[0] as HTMLCanvasElement;

        // Load ticket image
        const ticketImage = await this.loadImage(ticketImageUrl);

        // Create a new canvas to merge the ticket & QR code
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = ticketImage.width;
        finalCanvas.height = ticketImage.height;
        const ctx = finalCanvas.getContext('2d')!;

        // Draw ticket background
        ctx.drawImage(ticketImage, 0, 0, finalCanvas.width, finalCanvas.height);

        // Draw QR code at the correct position
        const qrX = xPosition; // Adjust X based on QR position
        const qrY = yPosition; // Adjust Y based on QR position
        const qrSize = 218; // Adjust size based on ticket layout

        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // Convert merged canvas to Blob
        const blob = await new Promise<Blob>((resolve) => {
          finalCanvas.toBlob((b) => resolve(b!), 'image/png');
        });

        zip.file(`ticket-${i + 1}.png`, blob);
      }

      // Generate and trigger download
      zip.generateAsync({ type: 'blob' }).then((content: string | Blob) => {
        const now = new Date();
        const formattedDateTime = this.datePipe.transform(now, 'EEEE, MMMM d, y h:mm a') || ''
        saveAs(content, `Kota Hanguout Tickets ${formattedDateTime}.zip`);
        this.isTicketsGenerated = false
        this.numberOfTicketsCtr.reset()
      });

    }
  }

  // Utility function to load an image
  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async insertUUID() {
    const client = generateClient<Schema>();

    const { errors, data: result } = await client.models.Todo.create({
      guid: this.generateRandomUUID(),
      hasEntered: false,
    })
    return { errors, data: result }
  }

  generateRandomUUID(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set UUID version (4) => xxxx-xxxx-4xxx-....
    bytes[6] = (bytes[6] & 0x0f) | 0x40;

    // Set UUID variant (RFC 4122 compliant) => xxxx-xxxx-xxxx-8xxx....
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [...bytes]
      .map((byte, i) => byte.toString(16).padStart(2, '0'))
      .join('')
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  }
}
