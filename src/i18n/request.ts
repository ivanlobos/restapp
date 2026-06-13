import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale: string;
  try {
    locale = (await requestLocale) ?? routing.defaultLocale;
  } catch {
    locale = routing.defaultLocale;
  }
  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
