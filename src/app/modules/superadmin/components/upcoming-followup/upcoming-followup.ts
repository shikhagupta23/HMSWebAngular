import { Component, OnInit, inject } from '@angular/core';
import { AppointmentService } from '../../services/appointment-service';

@Component({
  selector: 'app-upcoming-followup',
  standalone: false,
  templateUrl: './upcoming-followup.html',
  styleUrls: ['./upcoming-followup.scss'],
})
export class UpcomingFollowup implements OnInit {
  dataList: any[] = [];
  pageNumber = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;
  pages: number[] = [];

  searchTerm = '';
  fromDateInput: string = ''; // default empty
  noOfDays: any = ''; // default empty

  loading = false;


  private api = inject(AppointmentService);

  constructor() {}

  ngOnInit(): void {
    this.fetchData();
  }

  formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}-${mm}-${yy}`;
  }

  formatDateInput(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${yy}-${mm}-${dd}`;
  }

  formatDateFromInputToApi(input?: string): string {
    // If no date provided, return empty string so API receives empty filter
    if (!input) return '';
    const parts = input.split('-');
    if (parts.length !== 3) return '';
    // Convert from yyyy-mm-dd (input) to MM-DD-YYYY as requested (e.g., 12-17-2025)
    return `${parts[1]}-${parts[2]}-${parts[0]}`; // mm-dd-yyyy
  }

  fetchData(): void {
    this.loading = true;
    this.api.getUpcomingFollowUps(this.pageNumber, this.pageSize, this.searchTerm || '', 2, this.formatDateFromInputToApi(this.fromDateInput), this.noOfDays ?? '').subscribe({
      next: res => {
        this.dataList = res?.dataList || [];
        this.pageNumber = (res?.pageNumber && res.pageNumber > 0) ? res.pageNumber : this.pageNumber;
        this.pageSize = (res?.pageSize && res.pageSize > 0) ? res.pageSize : this.pageSize;
        this.totalCount = res?.totalCount || (this.dataList.length);
        this.totalPages = res?.totalPages || Math.ceil(this.totalCount / this.pageSize) || 1;
        this.buildPages();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.dataList = [];
        this.totalPages = 0;
        this.totalCount = 0;
        this.buildPages();
      }
    });
  }

  buildPages(): void {
    this.pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pages.push(i);
    }
  }

  onPageSizeChange(): void {
    this.pageNumber = 1;
    this.fetchData();
  }

  onSearch(): void {
    this.pageNumber = 1;
    this.fetchData();
  }

  applyFilters(): void {
    this.pageNumber = 1;
    this.fetchData();
  }

  goToPage(p: number): void {
    if (p === this.pageNumber) return;
    this.pageNumber = p;
    this.fetchData();
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.fetchData();
    }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.fetchData();
    }
  }

  trackById(index: number, item: any) {
    return item?.id || index;
  }

}
