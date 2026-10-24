import {
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Typography, Paper,
} from '@mui/material';
import { useId, useState } from 'react';
import type { Translations } from '../api/types';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { catalogs, isLocale, locales, type Locale } from '../i18n/catalogs';
import { labels, resolveCatalogText } from './catalog-translations';

type Props = { canonical: string; translations?: Translations; trait?: boolean };

export function CatalogPreview({ canonical, translations, trait = false }: Props) {
  const current = useLocale();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Locale>(current);
  const languageId = useId();
  const titleId = useId();
  const { text, fallback } = resolveCatalogText(canonical, translations, language);
  const languageLabels = { fr: t('workspace.french'), ...labels() };
  const close = () => setOpen(false);

  return <>
    <Button onClick={() => setOpen(true)}>{t('workspace.preview')}</Button>
    <Dialog open={open} onClose={close} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <DialogTitle id={titleId}>{t('workspace.fiction')}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel id={languageId}>{t('workspace.language')}</InputLabel>
          <Select labelId={languageId} label={t('workspace.language')} value={language} onChange={event => {
            if (isLocale(event.target.value)) setLanguage(event.target.value);
          }}>
            {locales.map(code => <MenuItem key={code} value={code}>{languageLabels[code]}</MenuItem>)}
          </Select>
        </FormControl>
        {fallback && <Typography color="text.secondary">{t('workspace.fallback')}</Typography>}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          {trait ? <Chip label={text} /> : <>
            <Typography variant="h6">{text}</Typography>
            <Typography sx={{ mt: 2 }}>{String(catalogs[language]['workspace.answer'])}</Typography>
          </>}
        </Paper>
      </DialogContent>
      <DialogActions><Button onClick={close}>{t('workspace.close')}</Button></DialogActions>
    </Dialog>
  </>;
}
