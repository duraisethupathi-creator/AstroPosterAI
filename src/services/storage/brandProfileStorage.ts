import AsyncStorage from '@react-native-async-storage/async-storage';
import {createBrandProfileStorage} from './brandProfileRepository';

// One serialized repository shared by the provider and any future consumers.
export const brandProfileStorage = createBrandProfileStorage(AsyncStorage);
export const {getBrandProfile, saveBrandProfile, updateBrandProfile, clearBrandProfile} = brandProfileStorage;
