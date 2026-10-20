import { labels, translatedLanguages } from './catalog-translations';
import type { TranslationForm } from './catalog-translations';
import { Chip, Stack, TextField } from '@mui/material';
import type { Translations } from '../api/types';

export function CatalogTranslationFields({ value, onChange, maxLength, multiline = false }: {
  value: TranslationForm;
  onChange: (value: TranslationForm) => void;
  maxLength: number;
  multiline?: boolean;
}) {
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {translatedLanguages.map((language) => (
        <TextField key={language} fullWidth multiline={multiline} label={labels[language]}
          value={value[language]} slotProps={{ htmlInput: { maxLength } }}
          helperText="Facultatif : le français est affiché si cette traduction est absente."
          onChange={(event) => onChange({ ...value, [language]: event.target.value })} />
      ))}
    </Stack>
  );
}

export function CatalogTranslationCoverage({ translations }: { translations?: Translations }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
      {translatedLanguages.map((language) => (
        <Chip key={language} size="small" variant="outlined" label={language.toUpperCase()}
          color={translations?.[language] ? 'success' : 'default'}
          title={`${labels[language]} : ${translations?.[language] ? 'traduction disponible' : 'repli en français'}`} />
      ))}
    </Stack>
  );
}
