import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { translationForm, translationPatch } from '../components/catalog-translations';
import { CatalogTranslationFields, CatalogTranslationCoverage } from '../components/CatalogTranslations';
import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material';
import { useState } from 'react';
import { createTrait, deleteTrait, getTraits, updateTrait } from '../api/admin';
import { errorMessage } from '../api/client';
import type { Trait } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';

export default function Traits() {
  useLocale();
  const { data, loading, error, reload } = useAsyncData(getTraits);
  const [editing, setEditing] = useState<Trait | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Trait | null>(null);
  const [name, setName] = useState('');
  const [translations, setTranslations] = useState(() => translationForm());
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const openEditor = (trait: Trait | 'new') => {
    setEditing(trait);
    setName(trait === 'new' ? '' : (trait.translations?.fr ?? trait.name));
    setTranslations(translationForm(trait === 'new' ? undefined : trait.translations));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') await createTrait(name, translationPatch(translations));
      else if (editing) await updateTrait(editing.id, name, translationPatch(translations));
      showNotification(editing === 'new' ? t("common.traitCreated") : t("common.traitRenamed"), 'success');
      setEditing(null);
      setName('');
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteTrait(deleting.id);
      showNotification(t("common.traitDeleted"), 'success');
      setDeleting(null);
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("common.traits")}
        description={t("traits.catalogueOfTraitsAvailableOnProfiles")}
        actions={(
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openEditor('new')}>
            {t("common.addATrait")}</Button>
        )}
      />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("common.name")}</TableCell>
                <TableCell>{t("common.identifier")}</TableCell>
                <TableCell align="right">{t("common.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((trait) => (
                <TableRow key={trait.id}>
                  <TableCell>{trait.name}<CatalogTranslationCoverage translations={trait.translations} /></TableCell>
                  <TableCell>{trait.id}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={t("common.renameValue", { value0: trait.name })} onClick={() => openEditor(trait)}>
                      <EditOutlined />
                    </IconButton>
                    <IconButton color="error" aria-label={t("common.deleteValue", { value0: trait.name })} onClick={() => setDeleting(trait)}>
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!data.length && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 5 }}>{t("traits.noTraitsConfigured")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing === 'new' ? t("common.newTrait") : t("common.renameTrait")}</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label={t("common.nameFrench")} value={name} onChange={(event) => setName(event.target.value)} sx={{ mt: 1 }} slotProps={{ htmlInput: { maxLength: 100 } }} />
          <CatalogTranslationFields value={translations} onChange={setTranslations} maxLength={100} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
          <Button variant="contained" disabled={saving || !name.trim()} onClick={() => void save()}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={t("common.deleteThisTrait")}
        description={t("traits.theTraitWillAlsoBeRemovedFromEveryProfile")}
        confirmLabel={t("common.delete")}
        danger
        loading={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
