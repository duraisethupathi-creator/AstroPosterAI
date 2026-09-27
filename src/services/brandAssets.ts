import {Directory, File, Paths} from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import {Platform} from 'react-native';
import type {BrandProfile} from '../types/brandProfile';

function assetDirectory() { return new Directory(Paths.document, 'brand-assets'); }

export async function pickBrandImage(): Promise<string | null> {
  // Native system photo pickers grant access to the selected image. No blanket
  // library/camera permission is needed for this images-only flow in SDK 57.
  if (Platform.OS === 'web') throw new Error('Native image storage required');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false,
    quality: 1, base64: false, exif: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const selected = result.assets[0];
  const directory = assetDirectory();
  directory.create({idempotent: true, intermediates: true});
  const source = new File(selected.uri);
  const extension = source.extension.match(/^\.[a-z0-9]{1,8}$/i)?.[0] ?? '.jpg';
  const destination = new File(directory, `brand-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  try {
    await source.copy(destination);
    return destination.uri;
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  }
}

// Only our generated files inside our dedicated directory can be removed.
// Saved and draft references are retained; never delete gallery/source images.
export function cleanupBrandImages(profiles: readonly BrandProfile[]): boolean {
  if (Platform.OS === 'web') return true;
  try {
    const directory = assetDirectory();
    if (!directory.exists) return true;
    const retained = new Set(profiles.flatMap(profile => [profile.logoUri, profile.profilePhotoUri]));
    for (const entry of directory.list()) {
      if (entry instanceof File && entry.name.startsWith('brand-') && !retained.has(entry.uri)) entry.delete();
    }
    return true;
  } catch { return false; }
}
