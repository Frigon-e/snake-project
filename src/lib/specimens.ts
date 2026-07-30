import type { Snake } from '../db/schema';

export const specimenStatuses = ['available', 'reserved', 'sold'] as const;

export type SpecimenStatus = (typeof specimenStatuses)[number];

export function getSpecimenStatus(
  specimen: Pick<Snake, 'status' | 'available'>,
): SpecimenStatus {
  if (specimen.status && specimenStatuses.includes(specimen.status as SpecimenStatus)) {
    return specimen.status as SpecimenStatus;
  }

  return specimen.available ? 'available' : 'sold';
}

export function isAvailable(status: SpecimenStatus): boolean {
  return status === 'available';
}

export function isDemoSpecimen(
  specimen: Pick<Snake, 'slug'>,
): boolean {
  return specimen.slug.startsWith('demo-');
}

export function getStatusLabel(status: SpecimenStatus): string {
  return {
    available: 'Available',
    reserved: 'Reserved',
    sold: 'Placed',
  }[status];
}

export function formatPrice(priceInCents: number): string | null {
  if (priceInCents <= 0) return null;

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
  }).format(priceInCents / 100);
}

export function formatHatchDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function specimenImageUrl(
  specimen: Pick<Snake, 'primaryImageKey'>,
): string {
  return specimen.primaryImageKey
    ? `/api/r2/image?key=${encodeURIComponent(specimen.primaryImageKey)}`
    : '/placeholder-snake.svg';
}

export function specimenImageAlt(
  specimen: Pick<Snake, 'name' | 'slug' | 'primaryImageKey'>,
): string {
  if (!specimen.primaryImageKey) return '';
  return isDemoSpecimen(specimen)
    ? `Illustrative demo image for ${specimen.name}`
    : specimen.name;
}
