import { Component, OnInit } from '@angular/core';
import { Employee } from 'src/app/models/employee.model';

@Component({
  selector: 'app-trash',
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.scss']
})
export class TrashComponent implements OnInit {

  employeeList:any[]=[];
  constructor() { }

  ngOnInit(): void {
    this.getDeletedEmployees();
  }

  /**
   * get deleted employees from the local storage
   */
  getDeletedEmployees(){
    this.employeeList = JSON.parse(localStorage.getItem('employee_trash')??'No Data Found');
  }

  /**
   * remove item from local storage and clear data from it
   */
  removeAll(){
    localStorage.removeItem('employee_trash');
    localStorage.clear();
    this.employeeList = [];
  }

}
