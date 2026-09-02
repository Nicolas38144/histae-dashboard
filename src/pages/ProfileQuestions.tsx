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

const categoryLabels: Record<ProfileQuestionCategory, string> = {
  daily_life: 'Vie quotidienne',
  personality: 'Personnalité',
  interests: 'Centres d’intérêt',
  relationships: 'Relations',
  conversation: 'Conversation',
};

type QuestionForm = {
  prompt: string;
  category: ProfileQuestionCategory;
  displayOrder: number;
};

const emptyForm: QuestionForm = { prompt: '', category: 'conversation', displayOrder: 100 };

export default function ProfileQuestions() {
  const load = useCallback(() => getProfileQuestions(), []);
  const { data, loading, error, reload } = useAsyncData(load);
  const [editing, setEditing] = useState<AdminProfileQuestion | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminProfileQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const openCreate = () => {
    setForm(emptyForm);
    setEditing('new');
  };

  const openEdit = (question: AdminProfileQuestion) => {
    setForm({
      prompt: question.prompt,
      category: question.category,
      displayOrder: question.display_order,
    });
    setEditing(question);
  };

  const save = async () => {
    setSaving(true);
    const input = {
      prompt: form.prompt,
      category: form.category,
      display_order: form.displayOrder,
    };
    try {
      if (editing === 'new') await createProfileQuestion(input);
      else if (editing) await updateProfileQuestion(editing.id, input);
      showNotification(editing === 'new' ? 'Question créée.' : 'Question modifiée.', 'success');
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
      showNotification('Question et réponses associées supprimées.', 'success');
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
        title="Questions de profil"
        description="Catalogue des questions auxquelles chaque utilisateur peut apporter jusqu’à trois réponses."
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>Ajouter une question</Button>}
      />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ordre</TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell align="right">Réponses</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((question) => (
                <TableRow key={question.id} hover>
                  <TableCell>{question.display_order}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{question.prompt}</Typography>
                    <Typography variant="caption" color="text.secondary">{question.code}</Typography>
                  </TableCell>
                  <TableCell><Chip size="small" label={categoryLabels[question.category]} /></TableCell>
                  <TableCell align="right">{question.answer_count}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`Modifier ${question.prompt}`} onClick={() => openEdit(question)}>
                      <EditOutlined />
                    </IconButton>
                    <IconButton color="error" aria-label={`Supprimer ${question.prompt}`} onClick={() => setDeleting(question)}>
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!data.length && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Aucune question configurée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing === 'new' ? 'Nouvelle question' : 'Modifier la question'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              multiline
              minRows={2}
              fullWidth
              label="Question"
              value={form.prompt}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              helperText={`${form.prompt.length}/200 caractères`}
              onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel id="profile-question-category-label">Catégorie</InputLabel>
              <Select
                labelId="profile-question-category-label"
                label="Catégorie"
                value={form.category}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  category: event.target.value as ProfileQuestionCategory,
                }))}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="number"
              label="Ordre d’affichage"
              value={form.displayOrder}
              slotProps={{ htmlInput: { min: 0, max: 10000 } }}
              onChange={(event) => setForm((current) => ({
                ...current,
                displayOrder: Number(event.target.value),
              }))}
            />
            {editing !== 'new' && editing && editing.answer_count > 0 && (
              <Typography variant="body2" color="warning.main">
                Toute modification sera immédiatement visible sur les {editing.answer_count} réponse(s) existante(s).
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Annuler</Button>
          <Button
            variant="contained"
            disabled={saving || form.prompt.trim().length < 3 || form.displayOrder < 0 || form.displayOrder > 10000}
            onClick={() => void save()}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Supprimer cette question ?"
        description={deleting
          ? `La question et ses ${deleting.answer_count} réponse(s) utilisateur seront supprimées définitivement.`
          : ''}
        confirmLabel="Supprimer définitivement"
        danger
        loading={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
