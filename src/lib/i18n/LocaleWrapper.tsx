import { cookies } from 'next/headers';
import { Locale, defaultLocale, locales } from './config';
import { LocaleProvider } from './LocaleProvider';

function getLocaleFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): Locale {
  try {
    const localeCookie = cookieStore.get('mdlooker-locale');
    if (localeCookie && locales.includes(localeCookie.value as Locale)) {
      return localeCookie.value as Locale;
    }
  } catch {
  }
  return defaultLocale;
}

export interface LocaleWrapperProps {
  children: React.ReactNode;
}

export async function LocaleWrapper({ children }: LocaleWrapperProps) {
  let initialLocale = defaultLocale;
  
  try {
    const cookieStore = await cookies();
    initialLocale = getLocaleFromCookie(cookieStore);
  } catch {
  }
  
  return (
    <LocaleProvider initialLocale={initialLocale}>
      {children}
    </LocaleProvider>
  );
}
