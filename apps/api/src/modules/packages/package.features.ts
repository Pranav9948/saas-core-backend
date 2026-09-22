export const PACKAGE_FEATURE_IDS = [
  'personal_training',
  'group_classes',
  'cardio',
  'strength_training',
  'functional_training',
  'yoga',
  'customized_diet_plan',
  'nutrition_consultation',
  'steam_bath',
  'sauna',
  'cold_water_therapy',
  'massage',
  'stretching_zone',
  'swimming_pool',
  'locker_room',
  'shower',
  'parking',
  'towel_service',
  'wifi',
  'all_day_access',
  'guest_passes',
] as const;

export const LIMITED_PACKAGE_FEATURES = [
  'steam_bath',
  'cold_water_therapy',
  'massage',
] as const;

export type PackageFeatureId = (typeof PACKAGE_FEATURE_IDS)[number];
export type LimitedPackageFeatureId = (typeof LIMITED_PACKAGE_FEATURES)[number];

const FEATURE_ID_SET = new Set<string>(PACKAGE_FEATURE_IDS);
const LIMITED_FEATURE_SET = new Set<string>(LIMITED_PACKAGE_FEATURES);

export function isLimitedPackageFeature(id: string): id is LimitedPackageFeatureId {
  return LIMITED_FEATURE_SET.has(id);
}

export function normalizePackageFeatures(input?: string[] | null): string[] {
  if (!input?.length) {
    return [];
  }

  return [...new Set(input.filter((id) => FEATURE_ID_SET.has(id)))];
}

export function parseFeatureLimits(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isInteger(raw)) {
      result[key] = raw;
    }
  }
  return result;
}

export function normalizePackageFeatureLimits(
  features: string[],
  limits?: Record<string, number> | null,
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const featureId of features) {
    if (!isLimitedPackageFeature(featureId)) {
      continue;
    }

    const value = limits?.[featureId];
    normalized[featureId] =
      typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31
        ? value
        : 2;
  }

  return normalized;
}
