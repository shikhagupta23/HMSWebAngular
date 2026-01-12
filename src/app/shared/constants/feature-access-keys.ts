export const FeatureAccessKeys = {
  UpcomingFollowUp: 'hghf23478ghg&YHGhyds',
  PastFollowUp: 'k98sdhf78SDHf7@uyu',
  Notification: '90sdHFJHfd9sdh#@',
  Revenue: 'KJH*&^sdjhsd8987'
} as const;

export type FeatureKey =
  typeof FeatureAccessKeys[keyof typeof FeatureAccessKeys];
