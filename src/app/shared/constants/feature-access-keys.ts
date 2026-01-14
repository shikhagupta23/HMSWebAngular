export const FeatureAccessKeys = {
  UpcomingFollowUp: 'hghf23478ghg&YHGhyds',
  PastFollowUp: 'k98sdhf78SDHf7@uyu',
  Notification: '90sdHFJHfd9sdh#@',
  Revenue: 'KJH*&^sdjhsd8987',
  Appointments: 'APPT@2389sdh23',
  ScheduledAppointments: 'SCH@2389sdh23',
  CompletedAppointments: 'COM@2389sdh23',
  OngoingAppointments: 'ONG@2389sdh23',
  CancelledAppointments: 'CAN@2389sdh23',
  Patients: 'PAT@2389sdh23'
} as const;

export type FeatureKey =
  typeof FeatureAccessKeys[keyof typeof FeatureAccessKeys];
