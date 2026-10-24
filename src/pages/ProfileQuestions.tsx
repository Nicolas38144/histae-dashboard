import { hasMissingTranslations } from '../components/catalog-translations';
import { CatalogPreview } from '../components/CatalogPreview';
import { Checkbox, FormControlLabel } from '@mui/material';
import { formatNumber } from '../utils/format';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { translationForm, translationPatch } from '../components/catalog-translations';
import { CatalogTranslationFields, CatalogTranslationCoverage } from '../components/CatalogTranslations';
import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import {
  createProfileQuestion,
  deleteProfileQuestion,
  getProfileQuestions,
  updateProfileQuestion,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminProfileQuestion, ProfileQuestionCategory } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';

const categoryLabels = (): Record<ProfileQuestionCategory, string> => ({
  daily_life: t("common.dailyLife"),
  personality: t("common.personality"),
  interests: t("common.interests"),
  relationships: t("common.relationships"),
  conversation: t("common.conversation"),
});

type QuestionForm = {
  prompt: string;
  category: ProfileQuestionCategory;
  displayOrder: number;
};

const emptyForm: QuestionForm = { prompt: '', category: 'conversation', displayOrder: 100 };

export default function ProfileQuestions() {
  useLocale();
  const load = useCallback(() => getProfileQuestions(), []);
  const { data, loading, error, reload } = useAsyncData(load);
  const [missingOnly,setMissingOnly]=useState(false);
  const [editing, setEditing] = useState<AdminProfileQuestion | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminProfileQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [translations, setTranslations] = useState(() => translationForm());
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const openCreate = () => {
    setForm(emptyForm);
    setTranslations(translationForm());
    setEditing('new');
  };

  const openEdit = (question: AdminProfileQuestion) => {
    setTranslations(translationForm(question.translations));
    setForm({
      prompt: question.translations?.fr ?? question.prompt,
      category: question.category,
      displayOrder: question.display_order,
    });
    setEditing(question);
  };

  const save = async () => {
    setSaving(true);
    const input = {
      prompt: form.prompt,
      translations: translationPatch(translations),
      category: form.category,
      display_order: form.displayOrder,
    };
    try {
      if (editing === 'new') await createProfileQuestion(input);
      else if (editing) await updateProfileQuestion(editing.id, input);
      showNotification(editing === 'new' ? t("common.questionCreated") : t("common.questionUpdated"), 'success');
      setEditing(null);
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
      await deleteProfileQuestion(deleting.id);
      showNotification(t("profileQuestions.questionAndAssociatedAnswersDeleted"), 'success');
      setDeleting(null);
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  const visibleItems = (data ?? []).filter(item=>!missingOnly || hasMissingTranslations(item.translations));
  return (
    <>
      <PageHeader
        title={t("common.profileQuestions")}
        description={t("profileQuestions.catalogueOfQuestionsEachUserCanAnswerWithUp")}
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>{t("common.addAQuestion")}</Button>}
      />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      <FormControlLabel control={<Checkbox checked={missingOnly} onChange={event=>setMissingOnly(event.target.checked)}/>} label={t('workspace.missing')} />
      {data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("common.order")}</TableCell>
                <TableCell>{t("common.question")}</TableCell>
                <TableCell>{t("common.category")}</TableCell>
                <TableCell align="right">{t("common.answers")}</TableCell>
                <TableCell align="right">{t("common.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleItems.map((question) => (
                <TableRow key={question.id} hover>
                  <TableCell>{formatNumber(question.display_order)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{question.prompt}</Typography>
                    <CatalogTranslationCoverage translations={question.translations} />
                    <Typography variant="caption" color="text.secondary">{question.code}</Typography>
                  </TableCell>
                  <TableCell><Chip size="small" label={categoryLabels()[question.category]} /></TableCell>
                  <TableCell align="right">{formatNumber(question.answer_count)}</TableCell>
                  <TableCell align="right">
                    <CatalogPreview canonical={question.translations?.fr ?? question.prompt} translations={question.translations} />
                    <IconButton aria-label={t("common.editValue", { value0: question.prompt })} onClick={() => openEdit(question)}>
                      <EditOutlined />
                    </IconButton>
                    <IconButton color="error" aria-label={t("common.deleteValue", { value0: question.prompt })} onClick={() => setDeleting(question)}>
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!visibleItems.length && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>{t("profileQuestions.noQuestionsConfigured")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing === 'new' ? t("common.newQuestion") : t("common.editQuestion")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              multiline
              minRows={2}
              fullWidth
              label={t("common.questionFrench")}
              value={form.prompt}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              helperText={t("common.value200Characters", { value0: form.prompt.length })}
              onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
            />
            <CatalogTranslationFields value={translations} onChange={setTranslations} maxLength={200} multiline />
          <CatalogPreview canonical={form.prompt} translations={{fr:form.prompt,...translations}} />
            <FormControl fullWidth>
              <InputLabel id="profile-question-category-label">{t("common.category")}</InputLabel>
              <Select
                labelId="profile-question-category-label"
                label={t("common.category")}
                value={form.category}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  category: event.target.value as ProfileQuestionCategory,
                }))}
              >
                {Object.entries(categoryLabels()).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="number"
              label={t("common.displayOrder")}
              value={form.displayOrder}
              slotProps={{ htmlInput: { min: 0, max: 10000 } }}
              onChange={(event) => setForm((current) => ({
                ...current,
                displayOrder: Number(event.target.value),
              }))}
            />
            {editing !== 'new' && editing && editing.answer_count > 0 && (
              <Typography variant="body2" color="warning.main">
                {t("questions.editWarning", { count: editing.answer_count })}</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={saving || form.prompt.trim().length < 3 || form.displayOrder < 0 || form.displayOrder > 10000}
            onClick={() => void save()}
          >
            {t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={t("profileQuestions.deleteThisQuestion")}
        description={deleting
          ? t("questions.deleteWarning", { count: deleting.answer_count })
          : ''}
        confirmLabel={t("profileQuestions.deletePermanently")}
        danger
        loading={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
