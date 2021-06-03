import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from 'src/app/models/employee.model';
import { EmployeeService } from 'src/app/services/employee.service';
import { retryWhen, delay, mergeMap, takeUntil } from 'rxjs/operators';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { FormControl } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardSubscription = new Subject();
  employeeList: Employee[] = [];
  /**
   * loading progress bar for fetching data
   */
  loadingResults = false;
  loadingText = '';
  deleteEmployes: Employee[] = [];
  avgSalary = 0;
  avgAge = 0;

  searchText = new FormControl(null);
  /**
   * loading spinner for delete button
   */
  actionResult = false;

  constructor(private _employeeService: EmployeeService) {}
  ngOnDestroy(): void {
    this.dashboardSubscription.next();
    this.dashboardSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.getAllEmployee();
  }
  /**
   * Get All Employees from the Dummy Server
   */
  getAllEmployee() {
    this.loadingResults = true;
    this.loadingText = 'Fetching Data from server...';
    this._employeeService
      .getAllEmployees()
      .pipe(
        //retry when we get error 429 (Too Many Requests) after delaying for 1500 ms or 1.5s
        retryWhen((errors) => {
          return errors.pipe(
            mergeMap((err) => {
              err.status === 429 ? of(err) : throwError(err);
              if (err.status === 429) {
                this.loadingText =
                  'Failed to fetch data from server. Retrying...';
                return of(err);
              } else {
                throw err;
              }
            }),
            delay(1500)
          );
        }),
        takeUntil(this.dashboardSubscription)
      )
      .subscribe(
        (result: any) => {
          if (result.status.toLowerCase() === 'success') {
            this.employeeList = result.data;
            //for fetching average salary and age
            let totalSalary = 0;
            let totalAge = 0;
            this.employeeList.forEach((element) => {
              totalSalary += parseInt(element.employee_salary);
              totalAge += parseInt(element.employee_age);
            });

            this.avgSalary = totalSalary / this.employeeList.length;
            this.avgAge = totalAge / this.employeeList.length;
          }
          this.loadingResults = false;
        },
        (err: HttpErrorResponse) => {
          console.error(err, 'Error');
          //display error message through sweetalert
          if (err.status === 504) {
            Swal.fire({
              title: '504 Gateway Error',
              text: 'Something wrong with the server. Please try again later!',
            });
          } else if(err.statusText.toLowerCase() === 'unknown error'){
            Swal.fire({
              title: "CORS Error",
              text:"Access to XMLHttpRequest has been blocked by CORS Policy"
            });
          }
          else{
            Swal.fire(err.message);
          }
          this.loadingResults = false;
        }
      );
  }
  /**
   * delete employee from the server
   * @param id Employee Id Number
   */
  removeEmployee(id: number) {
    //get employee from the list
    let employee = this.employeeList.find((x) => x.id === id);

    Swal.fire({
      title: 'Are you sure?',
      text: 'You can see your deleted files in the trash.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'teal',
      cancelButtonColor: 'red',
      confirmButtonText: 'Confirm',
    }).then((result) => {
      if (result.isConfirmed) {
        this.actionResult = true;
        this._employeeService
          .deleteEmployess(id)
          .pipe(
            //retry when we get error 429 (Too Many Requests) after delaying for 1500 ms or 1.5s
            retryWhen((errors) => {
              return errors.pipe(
                mergeMap((err) =>
                  err.status === 429 ? of(err) : throwError(err)
                ),
                delay(1500)
              );
            }),
            takeUntil(this.dashboardSubscription)
          )
          .subscribe(
            (data: any) => {
              //filter the employee list to remove the data from the list
              this.employeeList = this.employeeList.filter((x) => x.id !== id);
              this.deleteEmployes.push(employee ? employee : new Employee());
              //set the deleted data in the local storage to show them in trash
              localStorage.setItem(
                'employee_trash',
                JSON.stringify(this.deleteEmployes)
              );
              this.actionResult = false;
              if (data.status.toLowerCase() === 'success')
                Swal.fire('Delete Successfully');
            },
            (err) => {
              console.error(err);
              this.actionResult = false;
              if (err.status === 504) {
                Swal.fire({
                  title: '504 Gateway Error',
                  text: 'Something wrong with the server. Please try again later!',
                });
              } else if(err.statusText.toLowerCase() === 'unknown error'){
                Swal.fire({
                  title: "CORS Error",
                  text:"Access to XMLHttpRequest has been blocked by CORS Policy"
                });
              }
              else{
                Swal.fire(err.message);
              }
            }
          );
      }
    });
  }
}
