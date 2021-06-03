import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, Subscription, throwError } from 'rxjs';
import { delay, mergeMap, retryWhen, takeUntil } from 'rxjs/operators';
import { EmployeeCreate } from 'src/app/models/employee-create.model';
import { EmployeeService } from 'src/app/services/employee.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-employee-create',
  templateUrl: './employee-create.component.html',
  styleUrls: ['./employee-create.component.scss'],
})
export class EmployeeCreateComponent implements OnInit, OnDestroy {
  private createSubscription = new Subject();
  employeeForm = new FormGroup({
    name: new FormArray([
      new FormGroup({
        firstName: new FormControl(null, Validators.required),
        middleName: new FormControl(null),
        lastName: new FormControl(null, Validators.required),
      }),
    ]),
    salary: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^-?(0|[1-9]\d*)?$/),
    ]),
    age: new FormControl(null, [
      Validators.required,
      Validators.pattern(/^-?(0|[1-9]\d*)?$/),
    ]),
  });

  employeeCreate: EmployeeCreate = new EmployeeCreate();

  employeeId: number = 0;

  editMode = false;
  /**
   * for loading the spinner in the save button
   */

  savingEmployee = false;

  /**
   * for loading the progress bar when fetching the employee
   */

  loadingEmployee = false;

  /**
   * Text displayed when fetching the data from the server
   */
  loadingText = '';

  /**
   * Text for the heading at the top
   */
  actionText = 'Add';

  /**
   * Text for the heading at the list in the inserted data
   */
  employeedActionTitle = 'Created';

  insertedData: EmployeeCreate[] = [];

  /**
   * get form array from the employee form group
   */
  get fullName() {
    return this.employeeForm.get('name') as FormArray;
  }

  /**
   * get controls from the employee form group
   */
  get employeFormControls() {
    return this.employeeForm.controls;
  }

  constructor(
    private avRouter: ActivatedRoute,
    private _employeeService: EmployeeService
  ) {
    //get id from the route parameter
    this.avRouter.params.subscribe((params) => {
      this.employeeId = parseInt(params.id);
    });
  }
  ngOnDestroy(): void {
    this.createSubscription.next();
    this.createSubscription.unsubscribe();
  }

  ngOnInit(): void {
    if (this.employeeId != 0 && this.employeeId != null && this.employeeId) {
      this.actionText = 'Edit';
      this.employeedActionTitle = 'Edited';
      this.editMode = true;
      this.getEmployeeById(this.employeeId);
    } else {
      this.editMode = false;
      this.actionText = 'Add';
      this.employeedActionTitle = 'Added';
    }
  }

  /**
   * Create Employee in the server
   * @returns
   */
  createEmployee(formDir: FormGroupDirective) {
    //if the form is invalid it displays the message and returns
    if (this.employeeForm.invalid) {
      Swal.fire(
        'The submitted form is not valid. Please check the form and submit again!!'
      );
      return;
    }
    this.savingEmployee = true;
    // get full name of the employee from the form array
    this.employeeCreate.name =
      this.employeeForm.value.name[0].middleName != null
        ? this.employeeForm.value.name[0].firstName +
          ' ' +
          this.employeeForm.value.name[0].middleName +
          ' ' +
          this.employeeForm.value.name[0].lastName
        : this.employeeForm.value.name[0].firstName +
          ' ' +
          this.employeeForm.value.name[0].lastName;
    this.employeeCreate.age = this.employeeForm.value.age ?? 0;
    this.employeeCreate.salary = this.employeeForm.value.salary ?? 0;
    //if employee id is greater than 0 then update else create employee
    if (this.editMode) {
      //update employee
      this._employeeService
        .updateEmployess(this.employeeCreate, this.employeeId)
        .pipe(
          retryWhen((errors) => {
            return errors.pipe(
              mergeMap((err) =>
                err.status === 429 ? of(err) : throwError(err)
              ),
              delay(1500)
            );
          }),
          takeUntil(this.createSubscription)
        )
        .subscribe(
          (data: any) => {
            console.log(data, 'Edit data');
            this._employeeService.setEmployeeList(data.data);
            this.savingEmployee = false;
            formDir.resetForm();
            this.reset();
            Swal.fire('Updated Successfully');
          },
          (err) => {
            console.error(err, 'Error while saving edit');
            if (err.status === 504) {
              Swal.fire({
                title: '504 Gateway Error',
                text: 'Something wrong with the server. Please try again later!',
              });
            } else if (err.statusText.toLowerCase() === 'unknown error') {
              Swal.fire({
                title: 'CORS Error',
                text: 'Access to XMLHttpRequest has been blocked by CORS Policy',
              });
            } else {
              Swal.fire(err.message);
            }
          }
        );
    } else {
      //create employee
      this._employeeService
        .createEmployees(this.employeeCreate)
        .pipe(
          retryWhen((errors) => {
            return errors.pipe(
              mergeMap((err) =>
                err.status === 429 ? of(err) : throwError(err)
              ),
              delay(1500)
            );
          }),
          takeUntil(this.createSubscription)
        )
        .subscribe(
          (data: any) => {
            console.log(data, 'data');
            this._employeeService.setEmployeeList(data.data);
            this.savingEmployee = false;
            formDir.resetForm();
            this.reset();
            Swal.fire('Created Successfully');
          },
          (err) => {
            console.error(err, 'Error');
            if (err.status === 504) {
              Swal.fire({
                title: '504 Gateway Error',
                text: 'Something wrong with the server. Please try again later!',
              });
            } else if (err.statusText.toLowerCase() === 'unknown error') {
              Swal.fire({
                title: 'CORS Error',
                text: 'Access to XMLHttpRequest has been blocked by CORS Policy',
              });
            } else {
              Swal.fire(err.message);
            }
          }
        );
    }

    this.getInsertedData();
  }

  //get the inserted data that is stored in the subject
  getInsertedData() {
    this._employeeService.getEmployeeList().subscribe((data) => {
      this.insertedData = data;
    });
  }

  /**
   * Get Employee by Id from the server
   * @param id Employee Id Number
   */
  getEmployeeById(id: number) {
    this.loadingEmployee = true;
    this.loadingText = 'Fetching Data from server...';
    this._employeeService
      .getEmployeeById(this.employeeId)
      .pipe(
        retryWhen((errors) => {
          return errors.pipe(
            mergeMap((err) => {
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
        takeUntil(this.createSubscription)
      )
      .subscribe(
        (data: any) => {
          //get the fullname of the employee from the data and split it to set value in the firstname and last name of the employee
          let fullName = data.data.employee_name.split(' ');
          if (fullName.length === 2) {
            this.fullName.controls[0].get('firstName')?.setValue(fullName[0]);
            this.fullName.controls[0].get('lastName')?.setValue(fullName[1]);
          } else if (fullName.length > 2) {
            this.fullName.controls[0].get('firstName')?.setValue(fullName[0]);
            this.fullName.controls[0].get('middleName')?.setValue(fullName[1]);
            this.fullName.controls[0]
              .get('lastName')
              ?.setValue(fullName[fullName.length - 1]);
          }
          this.employeFormControls.salary.setValue(data.data.employee_salary);
          this.employeFormControls.age.setValue(data.data.employee_age);
          this.loadingEmployee = false;
        },
        (err: HttpErrorResponse) => {
          console.error(err);
          if (err.status === 504) {
            Swal.fire({
              title: '504 Gateway Error',
              text: 'Something wrong with the server. Please try again later!',
            });
          } else if (err.statusText.toLowerCase() === 'unknown error') {
            Swal.fire({
              title: 'CORS Error',
              text: 'Access to XMLHttpRequest has been blocked by CORS Policy',
            });
          } else {
            Swal.fire(err.message);
          }
          this.loadingEmployee = false;
        }
      );
  }

  reset() {
    this.editMode = false;
    this.actionText = 'Add';
    this.employeedActionTitle = 'Added';
    this.employeeForm.reset();
  }
}
