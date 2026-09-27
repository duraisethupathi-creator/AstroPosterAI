import {getCategory, type AstrologyCategoryId} from './categories';
import type {FieldId, FieldValue, FormValues} from './types';
import {localDate} from './validation';

export type CategoryFormState = {categoryId: AstrologyCategoryId; values: FormValues; generateAllZodiacs: boolean};
export type CategoryFormAction =
  | {type: 'category'; categoryId: AstrologyCategoryId; now?: Date}
  | {type: 'field'; id: FieldId; value: FieldValue}
  | {type: 'allZodiacs'; value: boolean};

export function createCategoryForm(categoryId: AstrologyCategoryId, now = new Date()): CategoryFormState {
  const values: FormValues = {includeBrand: true};
  for (const field of getCategory(categoryId).fields) {
    if (field.defaultValue !== undefined) values[field.id] = field.defaultValue;
    else if (field.id === 'month') values[field.id] = now.getMonth() + 1;
    else if (field.type === 'year') values[field.id] = String(now.getFullYear());
    else if (field.type === 'date' && field.required) values[field.id] = localDate(now);
    else if (field.type === 'toggle') values[field.id] = false;
    else values[field.id] = '';
  }
  return {categoryId, values, generateAllZodiacs: false};
}

export function categoryFormReducer(state: CategoryFormState, action: CategoryFormAction): CategoryFormState {
  const category = getCategory(state.categoryId);
  switch (action.type) {
    case 'category': return createCategoryForm(action.categoryId, action.now);
    case 'field':
      if (action.id !== 'includeBrand' && !category.fields.some(field => field.id === action.id)) return state;
      return {...state, values: {...state.values, [action.id]: action.value}};
    case 'allZodiacs':
      if (!category.supportsAllZodiacs) return state;
      return {...state, generateAllZodiacs: action.value, values: {...state.values, zodiac: ''}};
  }
}
