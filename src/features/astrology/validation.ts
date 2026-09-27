import type {AstrologyCategoryDefinition, FormValues, ValidationErrors} from './types';
import {isZodiacId} from './zodiac';

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function validateCategory(
  category: AstrologyCategoryDefinition, values: FormValues, generateAllZodiacs = false, now = new Date(),
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (typeof generateAllZodiacs !== 'boolean' || (generateAllZodiacs && !category.supportsAllZodiacs)) {
    errors.generateAllZodiacs = 'astro.bulkInvalid';
  }
  if (values.includeBrand !== undefined && typeof values.includeBrand !== 'boolean') errors.includeBrand = 'astro.invalidSelection';
  for (const field of category.fields) {
    if (field.type === 'zodiac' && generateAllZodiacs && category.supportsAllZodiacs) continue;
    const raw = values[field.id];
    const value = typeof raw === 'string' ? raw.trim() : raw;
    const missing = value === undefined || value === '';
    if (missing) {
      if (field.required || (field.type === 'zodiac' && category.requiresZodiac)) errors[field.id] = 'astro.required';
      continue;
    }
    switch (field.type) {
      case 'zodiac':
        if (!isZodiacId(value)) errors[field.id] = 'astro.invalidSelection';
        break;
      case 'year':
        if (!/^\d{4}$/.test(String(value)) || Number(value) < MIN_YEAR || Number(value) > MAX_YEAR) errors[field.id] = 'astro.invalidYear';
        break;
      case 'date':
        if (typeof value !== 'string' || !isValidDate(value)) errors[field.id] = 'astro.invalidDate';
        else if (field.pastOnly && value > localDate(now)) errors[field.id] = 'astro.futureBirthDate';
        break;
      case 'select':
        if (!field.options.some(option => option.value === value)) errors[field.id] = 'astro.invalidSelection';
        break;
      case 'toggle':
        if (typeof value !== 'boolean') errors[field.id] = 'astro.invalidSelection';
        break;
      case 'text':
      case 'multiline':
        if (typeof value !== 'string') errors[field.id] = 'astro.invalidText';
        else if (value.length > field.maxLength) errors[field.id] = 'astro.tooLong';
        break;
    }
  }
  return errors;
}
