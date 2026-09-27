import type {TranslationKey} from '../i18n';

export const BRAND_TEXT_FIELDS = [
  'businessName', 'astrologerName', 'qualification', 'phone', 'whatsapp',
  'email', 'address', 'website', 'instagram', 'facebook', 'youtube', 'tagline',
] as const;
export type BrandTextField = typeof BRAND_TEXT_FIELDS[number];
export type BrandAssetField = 'logoUri' | 'profilePhotoUri';
export type BrandProfileFields = Record<BrandTextField, string> & Record<BrandAssetField, string | null>;

export interface BrandProfile extends BrandProfileFields {
  createdAt: string | null;
  updatedAt: string | null;
}

export type BrandSnapshot = Readonly<Pick<BrandProfile,
  'businessName' | 'astrologerName' | 'phone' | 'whatsapp' | 'address' |
  'website' | 'logoUri' | 'profilePhotoUri'>>;
export type BrandValidationErrors = Partial<Record<BrandTextField, TranslationKey>>;

export function emptyBrandProfile(): BrandProfile {
  return {
    businessName: '', astrologerName: '', qualification: '', phone: '', whatsapp: '',
    email: '', address: '', website: '', instagram: '', facebook: '', youtube: '', tagline: '',
    logoUri: null, profilePhotoUri: null, createdAt: null, updatedAt: null,
  };
}

function localImageUri(value: unknown): string | null {
  return typeof value === 'string' && /^(file|content):\/\//.test(value) && value.length < 4096 ? value : null;
}

function timestamp(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}

// Whitelist fields when reading unknown/older JSON. Never retain image binaries.
export function normalizeBrandProfile(value: unknown): BrandProfile {
  const result = emptyBrandProfile();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  const input = value as Record<string, unknown>;
  for (const field of BRAND_TEXT_FIELDS) {
    if (typeof input[field] === 'string') result[field] = input[field].trim();
  }
  result.logoUri = localImageUri(input.logoUri);
  result.profilePhotoUri = localImageUri(input.profilePhotoUri);
  result.createdAt = timestamp(input.createdAt);
  result.updatedAt = timestamp(input.updatedAt);
  return result;
}

function validPhone(value: string): boolean {
  return /^\+?[\d\s().-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, ''));
}

export function validateBrandProfile(profile: BrandProfileFields): BrandValidationErrors {
  const errors: BrandValidationErrors = {};
  if (!profile.businessName.trim() && !profile.astrologerName.trim()) errors.businessName = 'brandIdentityRequired';
  if (profile.phone.trim() && !validPhone(profile.phone.trim())) errors.phone = 'brandPhoneInvalid';
  if (profile.whatsapp.trim() && !validPhone(profile.whatsapp.trim())) errors.whatsapp = 'brandWhatsappInvalid';
  if (profile.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) errors.email = 'brandEmailInvalid';
  if (profile.website.trim()) {
    try {
      const raw = profile.website.trim();
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const validHost = url.hostname.includes('.') && url.hostname.split('.').every(label => /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label));
      if (/\s/.test(raw) || !['http:', 'https:'].includes(url.protocol) || !validHost || url.username || url.password) throw new Error('Invalid website');
    } catch { errors.website = 'brandWebsiteInvalid'; }
  }
  return errors;
}

// Completeness is deliberately modest: identity + a reachable phone/WhatsApp.
// All other fields and both images remain optional.
export function isBrandProfileComplete(profile: BrandProfile): boolean {
  return Object.keys(validateBrandProfile(profile)).length === 0 && Boolean(profile.phone.trim() || profile.whatsapp.trim());
}

export function toBrandSnapshot(profile: BrandProfile): BrandSnapshot {
  const {businessName, astrologerName, phone, whatsapp, address, website, logoUri, profilePhotoUri} = profile;
  return Object.freeze({businessName, astrologerName, phone, whatsapp, address, website, logoUri, profilePhotoUri});
}
