import {Component, input} from '@angular/core';

@Component({
  selector: '[menuConfigButton]',
  standalone: true,
  templateUrl: './menu-config-buttons.html',
  styleUrl: './menu-config-buttons.scss',
})
export class MenuConfigButtons {
  iconName = input<string>('', {alias: 'menuConfigButton'});
}
