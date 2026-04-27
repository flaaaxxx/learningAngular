import { Component, input } from '@angular/core';

@Component({
  selector: 'button[appCustomButton], [appCustomButton], .class-custom-button',
  imports: [],
  templateUrl: './custom-button.html',
  styleUrl: './custom-button.css',
})
export class CustomButton {
    label = input<string>('', { alias: 'appCustomButton' });
}
