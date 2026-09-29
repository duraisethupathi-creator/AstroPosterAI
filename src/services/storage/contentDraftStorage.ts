import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContentDraftRepository} from './contentDraftRepository';
export const contentDraftStorage = createContentDraftRepository(AsyncStorage);
