import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gender',
  standalone: false
})
export class GenderPipe implements PipeTransform {


  transform(value: string): string {
    if (!value) return '';

    const gender = value.toString().trim().toLowerCase();

    switch (gender) {
      case 'm':
      case 'male':
        return 'Male';

      case 'f':
      case 'female':
        return 'Female';

      case 'o':
      case 'other':
      case 'others':
        return 'Other';

      default:
        return value;
    }
  }

}
