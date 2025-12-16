import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/users-service';
import { HospitalService } from '../../services/hospital-service';
import { ToastService } from '../../../../shared/services/toast-service';

declare const bootstrap: any;

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  dataList: any[] = [];

  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  searchTerm = '';

  addUserForm!: FormGroup;
  roles: any[] = [];
  hospitals: any[] = [];

  private fb = inject(FormBuilder);
  private api = inject(UsersService);
  private hospitalApi = inject(HospitalService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.loadRoles();
    this.loadHospitals();
  }

  initForm() {
    this.addUserForm = this.fb.group({
      FullName: ['', Validators.required],
      Gender: ['', Validators.required],
      DateOfBirth: [''],
      RoleId: ['', Validators.required],
      HospitalId: [''],
      PhoneNumber: ['', Validators.required],
      Password: ['', Validators.required],
      Address: ['']
    });
  }

  loadUsers() {
    this.api.getUsers(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res: any) => {
        this.dataList = res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);
        this.pageNumber = res.pageNumber ?? this.pageNumber;
        this.pageSize = res.pageSize ?? this.pageSize;
        this.totalCount = res.totalCount ?? res.total ?? (this.dataList?.length ?? 0);
        const computedPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.totalPages = res.totalPages ?? computedPages;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load users');
      }
    });
  }

  loadRoles() {
    this.api.getSystemRoles().subscribe({
      next: (res: any) => {
        // API may return { dataList:null, data: { ... } } or array
        this.roles = res.dataList ;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to load roles');
      }
    });
  }

  loadHospitals() {
    this.hospitalApi.getHospitals(1, 100, '').subscribe({
      next: (res: any) => {
        this.hospitals = res.dataList ?? res.items ?? res.data ?? res.result ?? (Array.isArray(res) ? res : []);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.loadUsers();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.pageNumber = page;
    this.loadUsers();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.loadUsers();
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadUsers();
    }
  }

  onSubmit() {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }

    const v = this.addUserForm.value;

    const payload: any = {
      FullName: v.FullName,
      Gender: v.Gender,
      DateOfBirth: v.DateOfBirth,
      RoleId: v.RoleId,
      HospitalId: v.HospitalId || null,
      PhoneNumber: v.PhoneNumber,
      Password: v.Password,
      Address: v.Address,
      UserName: v.PhoneNumber
    };

    this.api.addUser(payload).subscribe({
      next: (res) => {
        this.toast.success('User added successfully');
        const modalEl = document.getElementById('addUserModal');
        if (modalEl) {
          const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          m.hide();
        }
        this.addUserForm.reset();
        this.loadUsers();
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Failed to add user');
      }
    });
  }

  formatDate(date: string) {
    return date ? new Date(date).toDateString() : '';
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  onPageSizeChange() {
    this.pageNumber = 1;
    this.loadUsers();
  }

}
