import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment.delvelopment';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { ToastService } from '../../services/toast-service';
import html2pdf from 'html2pdf.js';

declare var bootstrap: any;

interface InvoiceData {
  id: string;
  invoiceNo: number;
  patientId: string;
  patientName: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentStatus: string;
  doctorId: string;
  doctorName: string;
  doctorFee: number;
  labTestFee: number;
  totalPayment: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface PaymentReportData {
  period: string;
  paymentId: string;
  amount: number;
  paymentCreatedAt: string;
  paymentCreatedBy: string;
  invoiceId: string;
  invoiceNo: number;
  invoiceCreatedBy: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
}

interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;  
  appointmentDate: string;
  appointmentFee?: number;
}

@Component({
  selector: 'app-invoice',
  standalone: false,
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss',
})
export class Invoice implements OnInit {

  // Invoice List
  invoices: InvoiceData[] = [];
  filteredInvoices: InvoiceData[] = [];
  searchInvoiceText: string = '';
  currentUserRole: string = '';
  private toastr = inject(ToastService);

  // Payment Report
  paymentReports: PaymentReportData[] = [];
  filteredReports: PaymentReportData[] = [];
  searchReportText: string = '';
  
  // Report Filters
  filterBy: string = 'month';
  fromDate: string = '';
  toDate: string = '';
  reportPage: number = 1;
  reportPageSize: number = 10;
  totalReportPages: number = 0;
  
  // View Toggle
  activeView: string = 'invoices';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  paginatedInvoices: InvoiceData[] = [];

  // Appointment Data
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  selectedAppointmentId: string = '';
  searchTerm: string = '';

  // Payment handling properties
  paymentAmount: number = 0;
  remainingAmount: number = 0;
  paymentStatus: string = 'Pending';
  existingPayments: number = 0;

  // Appointment details modal
  selectedInvoiceForDetails: InvoiceData | null = null;

  // ✅ NEW: Appointment Invoices Modal
  appointmentInvoices: InvoiceData[] = [];
  selectedAppointmentIdForInvoices: string = '';

  invoice = {
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    doctorFee: 0,
    labTestFee: 0,
    paymentMode: 'Cash',
    paymentStatus: 'Pending'
  };

  totalAmount: number = 0;
  isSubmitting: boolean = false;
  Math = Math;
  isRoleLoaded: boolean = false;
  
  private appointmentFeesLoaded: boolean = false;
  private labFeesLoaded: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadAppointments();
    this.initializeDateRange();
    this.loadCurrentUserRole();
  }

  isDoctor(): boolean {
    const role = this.currentUserRole?.toLowerCase().trim();
    return role === 'doctor';
  }

  initializeDateRange(): void {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    
    this.toDate = this.formatDateForInput(today);
    this.fromDate = this.formatDateForInput(lastYear);
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }

  private loadCurrentUserRole(): void {
    try {
      this.currentUserRole = this.authService.getUserRole() || '';
      this.isRoleLoaded = true;
    } catch (error) {
      this.currentUserRole = '';
      this.isRoleLoaded = true;
    }
  }

  loadInvoices(): void {
    this.http.get<any>(ApiEndpoints.INVOICE.GETINVOICEDATA).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Failed to load invoices');
          return;
        }

        this.invoices = res.dataList ?? [];
        this.filteredInvoices = this.invoices;
        this.updatePagination();
      },
      error: () => this.toast.error('Failed to load invoices'),
    });
  }

  searchInvoices(): void {
    if (!this.searchInvoiceText.trim()) {
      this.filteredInvoices = this.invoices;
    } else {
      const search = this.searchInvoiceText.toLowerCase();
      this.filteredInvoices = this.invoices.filter(inv =>
        inv.invoiceNo.toString().includes(search) ||
        inv.totalPayment.toString().includes(search) ||
        inv.patientName.toLowerCase().includes(search) ||
        inv.doctorName.toLowerCase().includes(search) ||
        inv.paymentStatus.toLowerCase().includes(search)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedInvoices = this.filteredInvoices.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAppointmentDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  getAppointmentNumber(appointmentId: string): string {
    if (!appointmentId) return 'N/A';
    return appointmentId;
  }

  // ✅ NEW: Show all invoices for a specific appointment
  viewInvoicesByAppointment(appointmentId: string): void {
    this.selectedAppointmentIdForInvoices = appointmentId;
    
    // Filter invoices by appointment ID
    this.appointmentInvoices = this.invoices.filter(
      inv => inv.appointmentId === appointmentId
    );
    
    // Open the modal
    const modalEl = document.getElementById('appointmentInvoicesModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // ✅ NEW: Get total paid for an appointment
  getAppointmentTotalPaid(appointmentId: string): number {
    return this.invoices
      .filter(inv => inv.appointmentId === appointmentId)
      .reduce((sum, inv) => sum + inv.paidAmount, 0);
  }

  // ✅ NEW: Get total remaining for an appointment
  getAppointmentTotalRemaining(appointmentId: string): number {
    return this.invoices
      .filter(inv => inv.appointmentId === appointmentId)
      .reduce((sum, inv) => sum + inv.remainingAmount, 0);
  }

  // ✅ NEW: Get invoice count for an appointment
  getInvoiceCountForAppointment(appointmentId: string): number {
    return this.invoices.filter(inv => inv.appointmentId === appointmentId).length;
  }

  viewAppointmentDetails(invoice: InvoiceData): void {
    this.selectedInvoiceForDetails = invoice;
    
    const modalEl = document.getElementById('appointmentDetailsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  printInvoice(invoice: InvoiceData): void {
    const apiUrl = `${ApiEndpoints.INVOICE.PRINT_INVOICE}/${invoice.id}`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        let htmlContent = this.extractAndCleanHtml(response);
        
        if (!htmlContent) {
          this.toastr.error(response?.message || 'No invoice data available for printing!');
          return;
        }
        
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        
        if (!printWindow) {
          this.toastr.error('Please allow pop-ups to print the invoice');
          return;
        }

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      },
      error: (err) => {
        console.error('Failed to load invoice HTML', err);
        this.toastr.error('Failed to generate invoice for printing!');
      }
    });
  }

  private extractAndCleanHtml(response: any): string {
    let htmlContent = '';
    if (response && response.data) {
      htmlContent = response.data;
    } else if (response && response.isSuccess && response.data) {
      htmlContent = response.data;
    } else if (typeof response === 'string') {
      htmlContent = response;
    } else {
      console.error('Unexpected response format:', response);
      return '';
    }

    htmlContent = htmlContent
      .replace(/\\r\\n/g, '\n')      
      .replace(/\\n/g, '\n')         
      .replace(/\\t/g, '\t')  
      .replace(/\\"/g, '"')         
      .replace(/\\'/g, "'")         
      .replace(/\\\\/g, '\\')   
      .trim();
    
    return htmlContent;
  }

  deleteInvoice(invoiceId: string): void {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    this.http
      .delete<any>(`${ApiEndpoints.INVOICE.GETDELETEINVOICE}/${invoiceId}`)
      .subscribe({
        next: (res) => {
          if (!res?.isSuccess) {
            this.toast.error(res?.message || 'Failed to delete invoice');
            return;
          }

          this.toast.success(res?.message || 'Invoice deleted successfully');
          this.loadInvoices();
        },
        error: () => this.toast.error('Failed to delete invoice'),
      });
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  loadPaymentReports(): void {
    if (!this.fromDate || !this.toDate) {
      this.toast.error('Please select from and to dates');
      return;
    }

    const url = `${ApiEndpoints.INVOICE.PAYMENTREPORT}?fromDate=${encodeURIComponent(this.fromDate)}&toDate=${encodeURIComponent(this.toDate)}&page=${this.reportPage}&pageSize=${this.reportPageSize}&filterBy=${this.filterBy}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.paymentReports = res.dataList ?? [];
        this.filteredReports = this.paymentReports;
      },
      error: (err) => this.toast.error('Failed to load payment reports')
    });
  }

  searchReports(): void {
    if (!this.searchReportText.trim()) {
      this.filteredReports = this.paymentReports;
      return;
    }

    const search = this.searchReportText.toLowerCase();
    this.filteredReports = this.paymentReports.filter(report =>
      report.invoiceNo.toString().includes(search) ||
      report.patientName.toLowerCase().includes(search) ||
      report.doctorName.toLowerCase().includes(search) ||
      report.amount.toString().includes(search) ||
      report.period.toLowerCase().includes(search)
    );
  }

  onFilterByChange(): void {
    this.reportPage = 1;
    this.loadPaymentReports();
  }

  switchView(view: string): void {
    this.activeView = view;
    if (view === 'reports' && this.paymentReports.length === 0) {
      this.loadPaymentReports();
    }
  }

  nextReportPage(): void {
    this.reportPage++;
    this.loadPaymentReports();
  }

  previousReportPage(): void {
    if (this.reportPage > 1) {
      this.reportPage--;
      this.loadPaymentReports();
    }
  }

  openGenerateInvoice(): void {
    const modalEl = document.getElementById('generateInvoiceModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  loadAppointments(): void {
    this.http
      .get<any>(ApiEndpoints.INVOICE.GET_DOCTOR_APPOINTMENT_BY_STATUS)
      .subscribe({
        next: (res) => {
          if (!res?.isSuccess) {
            this.toast.error(res?.message || 'Failed to load appointments');
            return;
          }

          this.appointments = res.data ?? [];
          this.filteredAppointments = this.appointments;
        },
        error: () => this.toast.error('Failed to load appointments'),
      });
  }

  filterAppointments(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAppointments = this.appointments;
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredAppointments = this.appointments.filter(appt =>
      appt.patientName.toLowerCase().includes(search)
    );
  }

  onAppointmentChange(): void {
    const selected = this.appointments.find(
      a => a.appointmentId === this.selectedAppointmentId
    );

    if (!selected) {
      this.resetInvoice();
      return;
    }

    this.appointmentFeesLoaded = false;
    this.labFeesLoaded = false;

    this.loadAppointmentDetails(this.selectedAppointmentId);
    this.loadLabTestDetails(this.selectedAppointmentId);
  }

  loadAppointmentDetails(appointmentId: string): void {
    this.http
      .get<any>(`${ApiEndpoints.INVOICE.GET_APPOINTMENT_FEES_BY_ID}?Id=${appointmentId}`)
      .subscribe({
        next: (res) => {
          if (!res?.isSuccess) {
            this.toast.error(res?.message || 'Failed to load appointment fee');
            return;
          }

          const selected = this.appointments.find(
            a => a.appointmentId === this.selectedAppointmentId
          );

          if (!selected) return;

          this.invoice.patientId = selected.patientId;
          this.invoice.patientName = selected.patientName;
          this.invoice.doctorId = selected.doctorId;
          this.invoice.doctorName = selected.doctorName;
          this.invoice.appointmentDate = this.formatDate(selected.appointmentDate);
          this.invoice.doctorFee = res.data ?? 0;

          this.appointmentFeesLoaded = true;
          this.calculateTotal();
          this.checkAndLoadRemainingAmount(appointmentId);
        },
        error: () => {
          this.toast.error('Failed to load appointment fee');
          this.appointmentFeesLoaded = true;
          this.checkAndLoadRemainingAmount(appointmentId);
        },
      });
  }

  loadLabTestDetails(appointmentId: string): void {
    this.http
      .get<any>(ApiEndpoints.INVOICE.GET_LAB_FEES_BY_AppointmentID, {
        params: { appointmentId: appointmentId },
      })
      .subscribe({
        next: (res) => {
          this.invoice.labTestFee = res?.isSuccess ? res.data ?? 0 : 0;
          this.labFeesLoaded = true;
          this.calculateTotal();
          this.checkAndLoadRemainingAmount(appointmentId);
        },
        error: () => {
          this.invoice.labTestFee = 0;
          this.labFeesLoaded = true;
          this.calculateTotal();
          this.checkAndLoadRemainingAmount(appointmentId);
        },
      });
  }

  private checkAndLoadRemainingAmount(appointmentId: string): void {
    if (this.appointmentFeesLoaded && this.labFeesLoaded) {
      this.loadRemainingAmount(appointmentId);
    }
  }

  loadRemainingAmount(appointmentId: string): void {
    const apiUrl = `${ApiEndpoints.INVOICE.GET_REMAINING_AMOUNT}?appointmentId=${appointmentId}`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        if (res?.isSuccess) {
          const apiRemainingAmount = res.data ?? this.totalAmount;
          
          this.existingPayments = Math.max(0, this.totalAmount - apiRemainingAmount);
          this.remainingAmount = apiRemainingAmount;
          this.paymentAmount = 0;
          
          if (this.remainingAmount === 0) {
            this.paymentStatus = 'Complete';
          } else if (this.existingPayments > 0) {
            this.paymentStatus = 'Partial';
          } else {
            this.paymentStatus = 'Pending';
          }
        }
      },
      error: () => {
        this.remainingAmount = this.totalAmount;
        this.existingPayments = 0;
        this.paymentAmount = 0;
        this.paymentStatus = 'Pending';
      }
    });
  }

  calculateTotal(): void {
    this.totalAmount = (this.invoice.doctorFee || 0) + (this.invoice.labTestFee || 0);
  }

  onPaymentAmountChange(): void {
    const currentPayment = this.paymentAmount || 0;
    const maxPayable = this.totalAmount - this.existingPayments;
    const newRemaining = maxPayable - currentPayment;
    
    this.remainingAmount = Math.max(0, newRemaining);
    
    if (newRemaining <= 0) {
      this.paymentStatus = 'Complete';
    } else if (currentPayment > 0) {
      this.paymentStatus = 'Partial';
    } else {
      this.paymentStatus = 'Pending';
    }
  }

  validatePaymentAmount(): boolean {
    if (this.paymentAmount <= 0) {
      this.toast.error('Payment amount must be greater than 0');
      return false;
    }
    
    const maxPayable = this.totalAmount - this.existingPayments;
    
    if (this.paymentAmount > maxPayable) {
      this.toast.error(`Payment amount (₹${this.paymentAmount.toFixed(2)}) cannot exceed remaining amount (₹${maxPayable.toFixed(2)})`);
      return false;
    }
    
    return true;
  }

  resetInvoice(): void {
    this.invoice = {
      patientId: '',
      patientName: '',
      doctorId: '',
      doctorName: '',
      appointmentDate: '',
      doctorFee: 0,
      labTestFee: 0,
      paymentMode: 'Cash',
      paymentStatus: 'Pending'
    };
    this.totalAmount = 0;
    this.paymentAmount = 0;
    this.remainingAmount = 0;
    this.existingPayments = 0;
    this.paymentStatus = 'Pending';
    this.appointmentFeesLoaded = false;
    this.labFeesLoaded = false;
  }

  generateInvoice(): void {
    if (!this.selectedAppointmentId || !this.invoice.patientId) {
      this.toast.error('Please select an appointment');
      return;
    }

    if (!this.validatePaymentAmount()) {
      return;
    }

    this.isSubmitting = true;

    const payload = {
      patientId: this.invoice.patientId,
      appointmentId: this.selectedAppointmentId,
      doctorFee: this.invoice.doctorFee || 0,
      labTestFee: this.invoice.labTestFee || 0,
      createdBy: 'Admin',
    };

    this.http.post<any>(ApiEndpoints.INVOICE.CREATE_INVOICE, payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess || !res?.id) {
          this.toast.error(res?.message || 'Failed to create invoice');
          this.isSubmitting = false;
          return;
        }

        this.createPayment(res.id);
      },
      error: () => {
        this.toast.error('Failed to create invoice');
        this.isSubmitting = false;
      },
    });
  }

  getTotalAmount(): number {
  return this.appointmentInvoices.reduce((sum, inv) => sum + inv.totalPayment, 0);
}

getTotalPaidAmount(): number {
  return this.appointmentInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
}

getTotalRemainingAmount(): number {
  return this.appointmentInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
}

  createPayment(invoiceId: string): void {
    const payload = {
      invoiceId,
      amount: this.paymentAmount,
      paymentMode: this.invoice.paymentMode,
      paymentStatus: this.paymentStatus,
      createdBy: 'Admin',
    };

    this.http.post<any>(ApiEndpoints.INVOICE.CREATE_PAYMENT, payload).subscribe({
      next: (res) => {
        if (!res?.isSuccess) {
          this.toast.error(res?.message || 'Payment failed');
          this.isSubmitting = false;
          return;
        }

        const message = this.paymentStatus === 'Complete' 
          ? 'Invoice & payment completed successfully'
          : `Partial payment recorded. Remaining: ₹${this.remainingAmount.toFixed(2)}`;
        
        this.toast.success(message);

        this.loadInvoices();
        this.loadAppointments();

        const modalEl = document.getElementById('generateInvoiceModal');
        bootstrap.Modal.getInstance(modalEl!)?.hide();

        this.resetInvoice();
        this.selectedAppointmentId = '';
        this.searchTerm = '';
        this.filteredAppointments = this.appointments;
        this.isSubmitting = false;
      },
      error: () => {
        this.toast.error('Payment failed');
        this.isSubmitting = false;
      },
    });
  }
}