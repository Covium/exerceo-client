import { FluentBundle, FluentResource } from '@fluent/bundle';
import { createFluentVue } from 'fluent-vue';
import { ref } from 'vue';
import enSource from '@/locales/en.ftl?raw';
import ruSource from '@/locales/ru.ftl?raw';
import type { Language } from '@/api/types';

function bundleFor(locale: Language, source: string): FluentBundle {
  const bundle = new FluentBundle(locale, { useIsolating: false });
  bundle.addResource(new FluentResource(source));
  return bundle;
}

const bundles: Record<Language, FluentBundle> = {
  en: bundleFor('en', enSource),
  ru: bundleFor('ru', ruSource),
};

export const fluentLocale = ref<Language>('en');

export const fluent = createFluentVue({
  bundles: [bundles.en],
});

export function setFluentLocale(language: string): void {
  const locale: Language = language === 'ru' ? 'ru' : 'en';
  fluentLocale.value = locale;
  fluent.bundles = [bundles[locale]];
}
