import { useAppContext } from '@/contexts';
import { translations, TranslationKey } from './translations';

export function useTranslation() {
  const { language } = useAppContext();
  
  // Get the language-specific dictionary, fallback to English if not found
  const dictionary = translations[language as keyof typeof translations] || translations.en;

  /**
   * Translate a key to the current language
   * @param key The key to translate
   * @param params Optional parameters for string interpolation
   * @returns The translated string
   */
  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    let text = dictionary[key] || translations.en[key] || key;
    
    // Handle parameter interpolation if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }
    
    return text;
  };

  return { t, language };
} 