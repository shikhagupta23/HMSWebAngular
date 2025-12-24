import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../../../environment/environment';
@Component({
  selector: 'app-hospital-details',
  standalone: false,
  templateUrl: './hospital-details.html',
  styleUrl: './hospital-details.scss',
})
export class HospitalDetails {
private location = inject(Location);
hospitalId!: string;
hospitalDetails:any;
ngOnInit() {
  const state = history.state;

  if (state?.hospitalId) {
    this.hospitalId = state.hospitalId;
    console.log(this.hospitalId);
    this.hospitalDetails = state.hospitalDetails;
    console.log(this.hospitalDetails);
  } else {
    console.warn('No state found, use URL params instead');
  }
}
 goBack() {
    this.location.back();
  }

getHospitalLogo(h: any): string {
  console.log('Hospital Details:', h);
    if (!h) return '';

    return `${environment.hospitalLogoPath}${h.hospitalImage}`;
  }
}
