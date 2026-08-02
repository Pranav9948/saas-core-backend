export enum Feature {
  MEMBERS = 'MEMBERS',
  TRAINERS = 'TRAINERS',
  STAFF = 'STAFF',
}

export const FEATURES = [Feature.MEMBERS, Feature.TRAINERS, Feature.STAFF] as const;
