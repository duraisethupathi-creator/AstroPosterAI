import {Alert} from 'react-native';
import type {TranslationKey} from '../i18n';
export function confirmStudioReplacement(t: (key: TranslationKey) => string): Promise<boolean> {
  return new Promise(resolve => Alert.alert(t('studio.replaceTitle'), t('studio.replaceMessage'), [
    {text: t('studio.cancel'), style: 'cancel', onPress: () => resolve(false)},
    {text: t('studio.replace'), style: 'destructive', onPress: () => resolve(true)},
  ], {cancelable: true, onDismiss: () => resolve(false)}));
}
