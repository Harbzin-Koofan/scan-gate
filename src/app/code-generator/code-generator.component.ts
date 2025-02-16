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
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';


@Component({
  selector: 'app-code-generator',
  imports: [MatCheckboxModule, MatProgressBarModule, QRCodeComponent, CommonModule, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
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
      console.log(output)
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
      let ticketImageUrl;
      let xPosition;
      let yPosition;
      let size;

      if (this.isForAdult) {
        ticketImageUrl = 'adults.png';
        xPosition = 68;
        yPosition = 166;
        size = 218;
      } else {
        ticketImageUrl = 'kids.png';
        xPosition = 1744;
        yPosition = 181;
        size = 212;
      }

      for (let i = 0; i < this.qrDataList.length; i++) {
        const qrCodeElement = this.qrCanvasList.toArray()[i] as any;
        console.log(this.qrCanvasList.length);
        const qrCanvas = qrCodeElement.qrcElement.nativeElement.children[0] as HTMLCanvasElement;

        // Load ticket image
        const ticketImage = await this.loadImage(ticketImageUrl);

        // Step 1: Draw Ticket First on a Temporary Canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = ticketImage.width;
        tempCanvas.height = ticketImage.height;
        const tempCtx = tempCanvas.getContext('2d')!;

        // Draw ticket background first
        tempCtx.drawImage(ticketImage, 0, 0, tempCanvas.width, tempCanvas.height);

        // Step 2: Overlay QR Code onto Ticket
        tempCtx.drawImage(qrCanvas, xPosition, yPosition, size, size);

        // Step 3: Rotate the Final Merged Image
        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = tempCanvas.height; // Swap width & height
        rotatedCanvas.height = tempCanvas.width;
        const rotatedCtx = rotatedCanvas.getContext('2d')!;

        // Rotate 90° clockwise
        rotatedCtx.translate(rotatedCanvas.width, 0);
        rotatedCtx.rotate(90 * Math.PI / 180);

        // Draw rotated image onto new canvas
        rotatedCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // Convert merged and rotated canvas to Blob
        const blob = await new Promise<Blob>((resolve) => {
          rotatedCanvas.toBlob((b) => resolve(b!), 'image/png');
        });

        zip.file(`${this.isForAdult ? 'Adult' : 'Kid'} ticket-${i + 1}.png`, blob);
      }

      // Generate and trigger download
      zip.generateAsync({ type: 'blob' }).then((content: string | Blob) => {
        const now = new Date();
        const formattedDateTime = this.datePipe.transform(now, 'EEEE, MMMM d, y h:mm a') || '';
        saveAs(content, `KH ${this.isForAdult ? 'Adults' : 'Kids'} Tickets ${formattedDateTime}.zip`);
        this.isTicketsGenerated = false;
        this.numberOfTicketsCtr.reset();
        this.qrDataList = [];
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
