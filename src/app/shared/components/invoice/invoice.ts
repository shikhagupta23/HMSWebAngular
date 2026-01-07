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
  doctorId: string;
  doctorName: string;
  doctorFee: number;
  labTestFee: number;
  totalPayment: number;
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

interface LabTest {
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
  filterBy: string = 'month'; // 'month', 'week', 'date'
  fromDate: string = '';
  toDate: string = '';
  reportPage: number = 1;
  reportPageSize: number = 10;
  totalReportPages: number = 0;
  
  // View Toggle
  activeView: string = 'invoices'; // 'invoices' or 'reports'

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  paginatedInvoices: InvoiceData[] = [];

  // Appointment Data
  appointments: Appointment[] = [];
  labtest: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  selectedAppointmentId: string = '';
  searchTerm: string = '';

  invoice = {
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    doctorFee: 0,
    labTestFee: 0,
    paymentMode: 'Cash'
  };

  totalAmount: number = 0;
  isSubmitting: boolean = false;
  Math = Math; // Expose Math to template

  constructor(private http: HttpClient ,private authService: AuthService,private toast: ToastService) {}

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
  // Initialize date range (last year to today)
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

isRoleLoaded: boolean = false;

private loadCurrentUserRole(): void {
  try {
    this.currentUserRole = this.authService.getUserRole() || '';
    this.isRoleLoaded = true;
  } catch (error) {
    this.currentUserRole = '';
    this.isRoleLoaded = true;
  }
}
  // Load all invoices
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


  // Search invoices
  searchInvoices(): void {
    if (!this.searchInvoiceText.trim()) {
      this.filteredInvoices = this.invoices;
    } else {
      const search = this.searchInvoiceText.toLowerCase();
      this.filteredInvoices = this.invoices.filter(inv =>
        inv.invoiceNo.toString().includes(search) ||
        inv.totalPayment.toString().includes(search) ||
        inv.patientName.toLowerCase().includes(search) ||
        inv.doctorName.toLowerCase().includes(search)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  // Pagination methods
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

  // Format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

// pdfInvoice(invoice: InvoiceData): void {
//   const apiUrl = `${ApiEndpoints.INVOICE.PRINT_INVOICE}/${invoice.id}`;

//   this.http.get<any>(apiUrl).subscribe({
//     next: (response) => {
//       let htmlContent = response?.data || '';

//       if (!htmlContent || htmlContent.trim().length < 100) {
//         this.toast.error('Failed to load invoice template');
//         return;
//       }

//       // Set desired filename (e.g., Invoice_67.pdf)
//       const desiredFilename = `Invoice_${invoice.invoiceNo}.pdf`;

//       // Inject/Replace the <title> tag in the HTML
//       const titleRegex = /<title>.*?<\/title>/i;
//       if (titleRegex.test(htmlContent)) {
//         htmlContent = htmlContent.replace(titleRegex, `<title>${desiredFilename}</title>`);
//       } else {
//         // If no <title>, add one in <head>
//         htmlContent = htmlContent.replace(/<head>/i, `<head><title>${desiredFilename}</title>`);
//       }

//       const printWindow = window.open('', '_blank', 'width=1000,height=800');

//       if (!printWindow) {
//         this.toast.error('Please allow pop-ups to download PDF');
//         return;
//       }

//       printWindow.document.open();
//       printWindow.document.write(htmlContent);
//       printWindow.document.close();

//       printWindow.onload = () => {
//         setTimeout(() => {
//           printWindow.focus();
//           printWindow.print();
//           this.toast.success('Print dialog opened → Choose "Save as PDF"');
//         }, 800);
//       };
//     },
//     error: () => {
//       this.toast.error('Failed to load invoice data');
//     }
//   });
// }

  // Print invoice
printInvoice(invoice: InvoiceData): void {
  const apiUrl = `${ApiEndpoints.INVOICE.PRINT_INVOICE}/${invoice.id}`;
  
  this.http.get<any>(apiUrl).subscribe({
    next: (response) => {
      // Extract and clean HTML content
      let htmlContent = this.extractAndCleanHtml(response);
      
      if (!htmlContent) {
        this.toastr.error(response?.message || 'No invoice data available for printing!');
        
        return;
      }
      
      // Open new window with proper dimensions
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      
      if (!printWindow) {
        this.toastr.error('Please allow pop-ups to print the invoice');
        return;
      }

      // Write the HTML content to the new window
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content and styles to load, then trigger print dialog
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

// Helper method to extract and clean HTML from API response
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

  // Delete invoice
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

  // Payment Report Methods
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

  // Load appointments from API
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


  // Filter appointments based on search term
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

  // Dropdown change handler
  onAppointmentChange(): void {
    const selected = this.appointments.find(
      a => a.appointmentId === this.selectedAppointmentId
    );

    if (!selected) {
      this.resetInvoice();
      return;
    }

    this.loadAppointmentDetails(this.selectedAppointmentId);
    this.loadLabTestDetails(this.selectedAppointmentId);
  }

  // Load appointment details with fee
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

        this.calculateTotal();
      },
      error: () => this.toast.error('Failed to load appointment fee'),
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
        this.calculateTotal();
      },
      error: () => {
        this.invoice.labTestFee = 0;
        this.calculateTotal();
      },
    });
}

  // Calculate total amount when fees change
  calculateTotal(): void {
    this.totalAmount = (this.invoice.doctorFee || 0) + (this.invoice.labTestFee || 0);
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
      paymentMode: 'Cash'
    };
    this.totalAmount = 0;
  }

// Generate Invoice - Two API Calls
generateInvoice(): void {
  if (!this.selectedAppointmentId || !this.invoice.patientId) {
    this.toast.error('Please select an appointment');
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


  // Create Payment
  createPayment(invoiceId: string): void {
  const payload = {
    invoiceId,
    amount: this.totalAmount,
    paymentMode: this.invoice.paymentMode,
    paymentStatus: 'Paid',
    createdBy: 'Admin',
  };

  this.http.post<any>(ApiEndpoints.INVOICE.CREATE_PAYMENT, payload).subscribe({
    next: (res) => {
      if (!res?.isSuccess) {
        this.toast.error(res?.message || 'Payment failed');
        this.isSubmitting = false;
        return;
      }

      this.toast.success('Invoice & payment generated successfully');

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