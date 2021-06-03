import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { delay, map, mergeMap, retryWhen } from 'rxjs/operators';
import { EmployeeCreate } from '../models/employee-create.model';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private employees: EmployeeCreate[] = [];

  private employeeList$ = new Subject<EmployeeCreate[]>();

  constructor(
    @Inject('BASE_URL') public baseUrl: string,
    private _httpClient: HttpClient
  ) {}

  getAllEmployees() {
    return this._httpClient.get(`${this.baseUrl}api/v1/employees`);
  }

  getEmployeeById(id: number) {
    return this._httpClient.get<Employee>(
      `${this.baseUrl}api/v1/employee/${id}`
    );
  }

  createEmployees(employees: EmployeeCreate) {
    //use this to resolve CORS policy
    //return this._httpClient.post(`/employeeapi/api/v1/create`, employees);
    //comment below code to resolve CORS Policy
    return this._httpClient.post(`${this.baseUrl}api/v1/create`, employees, {
      headers: new HttpHeaders()
        .set('Access-Control-Allow-Methods', '*')
        .set('Access-Control-Allow-Origin', '*')
        .set('Access-Control-Allow-Headers', '*'),
    });
  }

  updateEmployess(employees: any, id: number) {
    //use this to resolve CORS policy
    // return this._httpClient.put(`/employeeapi/api/v1/update/${id}`, employees);
    //comment below code to resolve CORS Policy
    return this._httpClient.put(
      `${this.baseUrl}api/v1/update/${id}`,
      employees,
      {
        headers: new HttpHeaders()
          .set('Access-Control-Allow-Methods', '*')
          .set('Access-Control-Allow-Origin', '*')
          .set('Access-Control-Allow-Headers', '*'),
      }
    );
  }

  deleteEmployess(id: number) {
    return this._httpClient.delete(`${this.baseUrl}api/v1/delete/${id}`);
  }

  initializeEmployeeList(employees: EmployeeCreate[]) {
    this.employees = employees;
    this.employeeList$.next(employees);
  }

  setEmployeeList(employee: EmployeeCreate) {
    this.employees.push(employee);
    this.employeeList$.next([...this.employees]);
  }

  getEmployeeList() {
    return this.employeeList$;
  }
}
