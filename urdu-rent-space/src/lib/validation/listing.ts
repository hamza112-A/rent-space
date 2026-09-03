import { z } from 'zod';
import { categoryFields } from '@/lib/categoryFields';

const optionalNumericString = z
  .string()
  .optional()
  .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), 'Enter a valid number');

export const listingSchema = z
  .object({
    category: z.string().min(1, 'Select a category'),
    subcategory: z.string().min(1, 'Select a subcategory'),
    title: z.string().trim().min(1, 'Title is required').max(150, 'Title must be under 150 characters'),
    description: z.string().trim().min(1, 'Description is required'),
    city: z.string().min(1, 'Select a city'),
    location: z.string().trim().min(1, 'Location/area is required'),
    images: z.number().min(1, 'Add at least one photo'),
    hourlyRate: optionalNumericString,
    dailyRate: optionalNumericString,
    weeklyRate: optionalNumericString,
    monthlyRate: optionalNumericString,
    deposit: optionalNumericString,
    cancellationPolicy: z.string().min(1),
    instantBook: z.boolean(),
    dynamicFields: z.record(z.string(), z.union([z.string(), z.boolean()])).default({}),
  })
  .refine((data) => !!(data.hourlyRate || data.dailyRate || data.weeklyRate || data.monthlyRate), {
    message: 'Set at least one price',
    path: ['dailyRate'],
  })
  .superRefine((data, ctx) => {
    const fields = categoryFields[data.category] || [];
    fields.forEach((field) => {
      if (!field.required) return;
      const value = data.dynamicFields[field.name];
      if (value === undefined || value === '' || value === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field.name.replace(/([A-Z])/g, ' $1')} is required`,
          path: ['dynamicFields', field.name],
        });
      }
    });
  });

export type ListingFormValues = z.infer<typeof listingSchema>;

export const LISTING_STEP_FIELDS: Record<number, (keyof ListingFormValues | `dynamicFields.${string}`)[]> = {
  1: ['category', 'subcategory'],
  2: ['title', 'description', 'city', 'location'],
  3: ['images'],
  4: ['hourlyRate', 'dailyRate', 'weeklyRate', 'monthlyRate'],
  5: [],
};
