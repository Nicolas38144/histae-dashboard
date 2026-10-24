import { navigationGroups } from '../../src/navigation/navigation';
import { hasMissingTranslations, resolveCatalogText } from '../../src/components/catalog-translations';

it('keeps monitoring restricted to superadmins even when searching', () => {
  const paths = (role: 'admin' | 'superadmin') => navigationGroups(role, '').flatMap(group => group.entries.map(entry => entry.path));
  expect(paths('admin')).not.toContain('/monitoring');
  expect(paths('superadmin')).toContain('/monitoring');
  expect(navigationGroups('admin', 'securite').flatMap(group => group.entries.map(entry => entry.path))).toContain('/security');
});

it('uses the same missing-translation policy for filtering and previews', () => {
  const translations = { fr: 'Texte', en: '   ', es: 'Texto', it: 'Testo' };
  expect(hasMissingTranslations(translations)).toBe(true);
  expect(resolveCatalogText('Texte', translations, 'en')).toEqual({ text: 'Texte', fallback: true });
  expect(resolveCatalogText('Texte', translations, 'it')).toEqual({ text: 'Testo', fallback: false });
  expect(hasMissingTranslations({ ...translations, en: 'Text' })).toBe(false);
});
