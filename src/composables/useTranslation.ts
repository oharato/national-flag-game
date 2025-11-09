import { computed } from 'vue';
import { useCountriesStore } from '../store/countries';
import { translations, type Translations } from '../i18n/translations';

export function useTranslation() {
  const countriesStore = useCountriesStore();
  
  const t = computed<Translations>(() => {
    return translations[countriesStore.currentLanguage];
  });
  
  return { t };
}
