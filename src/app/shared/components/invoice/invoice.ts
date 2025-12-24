import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment.delvelopment';
import { ApiEndpoints } from '../../constants/api-endpoints';
import { AuthService } from '../../../modules/auth/services/auth-service';
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

  constructor(private http: HttpClient ,private authService: AuthService) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadAppointments();
    this.initializeDateRange();
    this.loadCurrentUserRole();
  }

  isDoctor(): boolean {
    const role = this.currentUserRole?.toLowerCase().trim();
    console.log('Current User Role:', role); // Add this for debugging
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
    console.log('Loaded role:', this.currentUserRole); // Debug log
    this.isRoleLoaded = true;
  } catch (error) {
    console.error('Failed to load user role', error);
    this.currentUserRole = '';
    this.isRoleLoaded = true;
  }
}
  // Load all invoices
  loadInvoices(): void {
    this.http
      .get<any>(ApiEndpoints.INVOICE.GETINVOICEDATA)
      .subscribe({
        next: (res) => {
          this.invoices = res.dataList ?? [];
          this.filteredInvoices = this.invoices;
          this.updatePagination();
          console.log('Invoices loaded:', this.invoices);
        },
        error: (err) => console.error('Failed to load invoices', err)
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

  // Print invoice
  printInvoice(invoice: InvoiceData): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #Inv0000_${invoice.invoiceNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin: 20px 0; }
            .info-section { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice #: Inv0000_${invoice.invoiceNo}</p>
            <p>Date: ${this.formatDate(invoice.createdAt)}</p>
          </div>
          <div class="info-section">
            <div class="info-row">
              <strong>Patient:</strong>
              <span>${invoice.patientName}</span>
            </div>
            <div class="info-row">
              <strong>Doctor:</strong>
              <span>${invoice.doctorName}</span>
            </div>
          </div>
          <table>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Doctor Consultation Fee</td>
              <td>₹${invoice.doctorFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Lab Test Fee</td>
              <td>₹${invoice.labTestFee.toFixed(2)}</td>
            </tr>
          </table>
          <div class="total">
            Total: ₹${invoice.totalPayment.toFixed(2)}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Delete invoice
  deleteInvoice(invoiceId: string): void {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    this.http
      .delete(`${ApiEndpoints.INVOICE.GETDELETEINVOICE}/${invoiceId}`)
      .subscribe({
        next: () => {
          alert('Invoice deleted successfully!');
          this.loadInvoices();
        },
        error: (err) => {
          console.error('Failed to delete invoice', err);
          alert('Failed to delete invoice!');
        }
      });
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  // Payment Report Methods
  loadPaymentReports(): void {
    if (!this.fromDate || !this.toDate) {
      alert('Please select from and to dates');
      return;
    }

    const url = `${ApiEndpoints.INVOICE.PAYMENTREPORT}?fromDate=${encodeURIComponent(this.fromDate)}&toDate=${encodeURIComponent(this.toDate)}&page=${this.reportPage}&pageSize=${this.reportPageSize}&filterBy=${this.filterBy}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.paymentReports = res.dataList ?? [];
        this.filteredReports = this.paymentReports;
        console.log('Payment reports loaded:', this.paymentReports);
      },
      error: (err) => console.error('Failed to load payment reports', err)
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
          this.appointments = res.data ?? [];
          this.filteredAppointments = this.appointments;
          console.log('Appointments loaded:', this.appointments);
        },
        error: (err) => console.error('Failed to load appointments', err)
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

    // Fetch detailed appointment data including appointmentFee
    this.loadAppointmentDetails(this.selectedAppointmentId);
      // Lab test fee (CHANGE ID BASED ON YOUR API)
    this.loadLabTestDetails(selected.hospitalId);
  }

  // Load appointment details with fee
 loadAppointmentDetails(appointmentId: string): void {
  this.http
    .get<any>(`${ApiEndpoints.INVOICE.GET_APPOINTMENT_FEES_BY_ID}?Id=${appointmentId}`)
    .subscribe({
      next: (res) => {
        // The API returns { data: feeValue }, not dataList
        if (res.data !== undefined && res.data !== null) {
          const appointmentFee = res.data;
          
          // Get basic appointment info from the selected appointment
          const selected = this.appointments.find(
            a => a.appointmentId === this.selectedAppointmentId
          );
          
          if (selected) {
            this.invoice.patientId = selected.patientId;
            this.invoice.patientName = selected.patientName;
            this.invoice.doctorId = selected.doctorId;
            this.invoice.doctorName = selected.doctorName;
            this.invoice.appointmentDate = this.formatDate(selected.appointmentDate);
            this.invoice.doctorFee = appointmentFee; // Use fee from API
            
            // Recalculate total
            this.calculateTotal();
            
            console.log('Appointment fee loaded:', appointmentFee);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load appointment fee', err);
        // Fallback to basic appointment data
        const selected = this.appointments.find(
          a => a.appointmentId === this.selectedAppointmentId
        );
        if (selected) {
          this.invoice.patientId = selected.patientId;
          this.invoice.patientName = selected.patientName;
          this.invoice.doctorId = selected.doctorId;
          this.invoice.doctorName = selected.doctorName;
          this.invoice.appointmentDate = this.formatDate(selected.appointmentDate);
          this.invoice.doctorFee = selected.appointmentFee || 0;
          this.calculateTotal();
        }
      }
    });
}

loadLabTestDetails(hospitalId: string): void {
  this.http
    .get<any>(ApiEndpoints.INVOICE.GET_LAB_FEES_BY_ID, { params: { Id: hospitalId } })
    .subscribe({
      next: (res) => {
        this.invoice.labTestFee = res.data ?? 0;
        this.calculateTotal();
      },
      error: () => {
        this.invoice.labTestFee = 0;
        this.calculateTotal();
      }
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
      alert('Please select a patient and enter fees');
      return;
    }

    this.isSubmitting = true;

    // Step 1: Create Invoice
    const invoicePayload = {
      patientId: this.invoice.patientId,
      appointmentId: this.selectedAppointmentId,
      doctorFee: this.invoice.doctorFee || 0,
      labTestFee: this.invoice.labTestFee || 0,
      createdBy: 'Admin'
    };

    console.log('Creating Invoice:', invoicePayload);

    this.http.post<any>(ApiEndpoints.INVOICE.CREATE_INVOICE, invoicePayload)
      .subscribe({
        next: (invoiceRes) => {
          console.log('Invoice Created:', invoiceRes);

          const invoiceId = invoiceRes.id;

          if (!invoiceId) {
            alert('Invoice created but ID not received!');
            this.isSubmitting = false;
            return;
          }

          // Step 2: Create Payment
          this.createPayment(invoiceId);
        },
        error: (err) => {
          console.error('Failed to create invoice', err);
          alert('Failed to create invoice!');
          this.isSubmitting = false;
        }
      });
  }

  // Create Payment
  createPayment(invoiceId: string): void {
    const paymentPayload = {
      invoiceId: invoiceId,
      amount: this.totalAmount,
      paymentMode: this.invoice.paymentMode,
      paymentStatus: 'Paid',
      createdBy: 'Admin'
    };

    console.log('Creating Payment:', paymentPayload);

    this.http.post<any>(ApiEndpoints.INVOICE.CREATE_PAYMENT, paymentPayload)
      .subscribe({
        next: (paymentRes) => {
          console.log('Payment Created:', paymentRes);
          alert('Invoice and Payment generated successfully!');
          
          // Reload invoices
          this.loadInvoices();
          
          // Close modal
          const modalEl = document.getElementById('generateInvoiceModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();
          }
          
          // Reset form
          this.selectedAppointmentId = '';
          this.searchTerm = '';
          this.resetInvoice();
          this.filteredAppointments = this.appointments;
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Failed to create payment', err);
          alert('Invoice created but payment failed!');
          this.isSubmitting = false;
        }
      });
  }
}