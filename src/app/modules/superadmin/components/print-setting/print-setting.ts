import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var $: any; // For jQuery and Summernote

interface PrintSetting {
  id?: number;
  hospitalId?: string;
  headerHtml?: string;
  footerHtml?: string;
  bodyHtml?: string;
  baseHtml?: string;
  pageSize?: string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  isHeaderFooterSaved?: boolean;
}

@Component({
  selector: 'app-print-setting',
  standalone: false,
  templateUrl: './print-setting.html',
  styleUrls: ['./print-setting.scss']
})
export class PrintSettingComponent implements OnInit, AfterViewInit, OnDestroy {
  printSettings: PrintSetting = {
    id: 0,
    hospitalId: '',
    headerHtml: '',
    footerHtml: '',
    bodyHtml: '',
    baseHtml: '',
    pageSize: 'A4',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    isHeaderFooterSaved: false
  };

  private summernotesInitialized = false;
  private apiBaseUrl = 'https://api-clinicmanagement.rsdemoprojects.in/api/HospitalAPI';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Load existing print settings
    this.loadPrintSettings();
  }

  ngAfterViewInit(): void {
    // Initialize Summernote after view is fully loaded
    setTimeout(() => {
      this.initializeSummernote();
    }, 500);
  }

  loadPrintSettings(): void {
    // Fetch print settings from API
    const hospitalId = this.getHospitalId(); // Get from session/local storage
    
    this.http.get<PrintSetting>(`${this.apiBaseUrl}/GetPrintSettings?hospitalId=${hospitalId}`).subscribe(
      (data) => {
        if (data) {
          this.printSettings = data;
          // Update Summernote editors after data is loaded
          if (this.summernotesInitialized) {
            this.updateSummernoteContent();
          } else {
            // If summernotes not initialized yet, wait and try again
            setTimeout(() => {
              this.updateSummernoteContent();
            }, 1000);
          }
        }
      },
      (error) => {
        console.error('Error loading print settings:', error);
        // Even if loading fails, initialize summernote
        setTimeout(() => {
          this.initializeSummernote();
        }, 500);
      }
    );
  }

  initializeSummernote(): void {
    // Check if jQuery and Summernote are available
    if (typeof $ === 'undefined' || typeof $.fn.summernote === 'undefined') {
      console.error('jQuery or Summernote not loaded');
      return;
    }

    // Destroy existing instances if any
    if ($('.summernote').data('summernote')) {
      $('.summernote').summernote('destroy');
    }

    // Initialize all summernote editors
    $('#headerEditor').summernote({
      height: 180,
      placeholder: 'Enter header HTML content...',
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['font', ['fontsize', 'color']],
        ['para', ['ul', 'ol', 'paragraph', 'align']],
        ['insert', ['link', 'picture']],
        ['view', ['codeview', 'fullscreen']]
      ]
    });

    $('#footerEditor').summernote({
      height: 180,
      placeholder: 'Enter footer HTML content...',
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['font', ['fontsize', 'color']],
        ['para', ['ul', 'ol', 'paragraph', 'align']],
        ['insert', ['link', 'picture']],
        ['view', ['codeview', 'fullscreen']]
      ]
    });

    $('#bodyEditor').summernote({
      height: 180,
      placeholder: 'Enter body HTML content...',
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['font', ['fontsize', 'color']],
        ['para', ['ul', 'ol', 'paragraph', 'align']],
        ['insert', ['link', 'picture']],
        ['view', ['codeview', 'fullscreen']]
      ]
    });

    $('#baseEditor').summernote({
      height: 180,
      placeholder: 'Enter base HTML content...',
      toolbar: [
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['font', ['fontsize', 'color']],
        ['para', ['ul', 'ol', 'paragraph', 'align']],
        ['insert', ['link', 'picture']],
        ['view', ['codeview', 'fullscreen']]
      ]
    });

    this.summernotesInitialized = true;

    // Set initial content if available
    if (this.printSettings.headerHtml || this.printSettings.footerHtml) {
      this.updateSummernoteContent();
    }
  }

  updateSummernoteContent(): void {
    if (!this.summernotesInitialized) {
      return;
    }

    try {
      $('#headerEditor').summernote('code', this.printSettings.headerHtml || '');
      $('#footerEditor').summernote('code', this.printSettings.footerHtml || '');
      $('#bodyEditor').summernote('code', this.printSettings.bodyHtml || '');
      $('#baseEditor').summernote('code', this.printSettings.baseHtml || '');
    } catch (error) {
      console.error('Error updating Summernote content:', error);
    }
  }

  saveSettings(): void {
    if (!this.summernotesInitialized) {
      alert('Editors are still loading. Please wait a moment and try again.');
      return;
    }

    // Get content from Summernote editors
    const model: PrintSetting = {
      id: this.printSettings.id || 0,
      hospitalId: this.getHospitalId(),
      headerHtml: $('#headerEditor').summernote('code'),
      footerHtml: $('#footerEditor').summernote('code'),
      bodyHtml: $('#bodyEditor').summernote('code'),
      baseHtml: $('#baseEditor').summernote('code'),
      pageSize: this.printSettings.pageSize || 'A4',
      marginTop: this.printSettings.marginTop || 0,
      marginBottom: this.printSettings.marginBottom || 0,
      marginLeft: this.printSettings.marginLeft || 0,
      marginRight: this.printSettings.marginRight || 0,
      isHeaderFooterSaved: true
    };

    this.http.post<any>(`${this.apiBaseUrl}/SavePrintsettings`, model).subscribe(
      (response) => {
        if (response && response.isSuccess) {
          alert('Settings saved successfully!');
          // Reload settings to get updated data
          this.loadPrintSettings();
        } else {
          alert('Error: ' + (response?.message || 'Failed to save settings'));
        }
      },
      (error) => {
        alert('Something went wrong while saving settings.');
        console.error('Error:', error);
      }
    );
  }

  getHospitalId(): string {
    // Get hospitalId from session storage, local storage, or service
    // Modify this based on how you store the hospital ID in your app
    const hospitalId = sessionStorage.getItem('hospitalId') || 
                      localStorage.getItem('hospitalId') || 
                      '3fa85f64-5717-4562-b3fc-2c963f66afa6'; // Default fallback
    return hospitalId;
  }

  ngOnDestroy(): void {
    // Destroy Summernote instances to prevent memory leaks
    try {
      if (this.summernotesInitialized) {
        $('.summernote').summernote('destroy');
      }
    } catch (error) {
      console.error('Error destroying Summernote:', error);
    }
  }
}