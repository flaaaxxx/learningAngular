import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomButton } from '../../custom-button/custom-button';
import { Title } from "../../share/title/title";

@Component({
  selector: 'app-users',
  imports: [CustomButton, Title, MatIconModule],
  templateUrl: './users-view.html',
  styleUrl: './users-view.scss',
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

  addUser() {
    this.users.push({
      id: this.users.length + 1, 
      name: `User ${this.users.length + 1}` 
    });
  }

  deleteUser() {
    if (this.users.length > 0) {
      this.users.pop();
    }
  }
}
