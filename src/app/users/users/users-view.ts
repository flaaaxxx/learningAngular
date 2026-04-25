import { Component, OnInit } from '@angular/core';
import { CustomButton } from '../../custom-button/custom-button';

@Component({
  selector: 'app-users',
  imports: [CustomButton],
  templateUrl: './users-view.html',
  styleUrl: './users-view.css',
  standalone: true
})
export default class UsersView implements OnInit {

  users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ];

  ngOnInit(): void {
    
  }
}
