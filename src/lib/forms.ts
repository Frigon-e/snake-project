import { z } from 'astro/zod';
import { specimenStatuses } from './specimens';

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const optionalDate = optionalText.refine((value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return !value;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid hatch date');

const optionalInteger = z
  .union([z.literal(''), z.coerce.number().int().min(0)])
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const featuredField = z
  .literal('true')
  .optional()
  .transform((value) => value === 'true');

export const inquiryFormSchema = z.object({
  snakeId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  message: z.string().trim().min(10, 'Please include a little more detail').max(2_000),
  website: z.literal('').default(''),
});

export const specimenFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens'),
  species: z.string().trim().min(1, 'Species is required').max(120),
  description: z.string().trim().max(2_000).default(''),
  priceDollars: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .max(100_000)
    .default(0)
    .transform((value) => Math.round(value * 100)),
  featured: featuredField,
  status: z.enum(specimenStatuses).default('available'),
  primaryImageKey: optionalText,
  sex: z.enum(['male', 'female', 'unknown']).optional(),
  hatchDate: optionalDate,
  personality: optionalText,
  feedingNotes: optionalText,
  diet: optionalText,
  shedFrequency: optionalText,
  temperature: optionalText,
  humidity: optionalText,
  weightGrams: optionalInteger,
  complementaryGenetics: optionalText,
});
