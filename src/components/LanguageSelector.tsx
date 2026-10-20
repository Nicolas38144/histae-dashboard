import { LanguageOutlined } from '@mui/icons-material';
import { Button, Menu, MenuItem } from '@mui/material';
import { useId, useState } from 'react';
import { locales, type Locale, type MessageKey } from '../i18n/catalogs';
import { setLocale, t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';

const languageKeys: Record<Locale, MessageKey> = {
  fr: 'language.french', en: 'language.english', es: 'language.spanish', it: 'language.italian',
};

export function LanguageSelector() {
  const locale = useLocale();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return <>
    <Button color="inherit" startIcon={<LanguageOutlined />} aria-label={t('language.change')}
      aria-controls={anchor ? menuId : undefined} aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={(event) => setAnchor(event.currentTarget)}>
      {t(languageKeys[locale])}
    </Button>
    <Menu id={menuId} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
      slotProps={{ list: { 'aria-label': t('language.change') } }}>
      {locales.map((language) => <MenuItem key={language} lang={language} selected={language === locale}
        onClick={() => { setLocale(language); setAnchor(null); }}>
        {t(languageKeys[language])}
      </MenuItem>)}
    </Menu>
  </>;
}
