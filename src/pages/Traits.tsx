import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useCallback, useState } from 'react';
import { createTrait, deleteTrait, getTraits, updateTrait } from '../api/admin';
import { errorMessage } from '../api/client';
import type { Trait } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';

export default function Traits() {
  const load = useCallback(() => getTraits(), []);
  const { data, loading, error, reload } = useAsyncData(load);
  const [editing, setEditing] = useState<Trait | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Trait | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const save = async () => {
    setSaving(true);
    try {
      if (editing === 'new') await createTrait(name); else if (editing) await updateTrait(editing.id, name);
      showNotification(editing === 'new' ? 'Trait créé.' : 'Trait renommé.', 'success'); setEditing(null); setName(''); reload();
    } catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!deleting) return; setSaving(true);
    try { await deleteTrait(deleting.id); showNotification('Trait supprimé.', 'success'); setDeleting(null); reload(); }
    catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Traits" description="Catalogue des traits proposés dans les profils." actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setEditing('new'); setName(''); }}>Ajouter un trait</Button>} />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Nom</TableCell><TableCell>Identifiant</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{data.map((trait) => <TableRow key={trait.id}><TableCell>{trait.name}</TableCell><TableCell>{trait.id}</TableCell><TableCell align="right"><IconButton aria-label={`Renommer ${trait.name}`} onClick={() => { setEditing(trait); setName(trait.name); }}><EditOutlined /></IconButton><IconButton color="error" aria-label={`Supprimer ${trait.name}`} onClick={() => setDeleting(trait)}><DeleteOutline /></IconButton></TableCell></TableRow>)}{!data.length && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5 }}>Aucun trait configuré.</TableCell></TableRow>}</TableBody></Table></Paper>}
      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} fullWidth maxWidth="sm"><DialogTitle>{editing === 'new' ? 'Nouveau trait' : 'Renommer le trait'}</DialogTitle><DialogContent><TextField autoFocus fullWidth label="Nom" value={name} onChange={(event) => setName(event.target.value)} sx={{ mt: 1 }} /></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Annuler</Button><Button variant="contained" disabled={saving || !name.trim()} onClick={() => void save()}>Enregistrer</Button></DialogActions></Dialog>
      <ConfirmActionDialog open={Boolean(deleting)} title="Supprimer ce trait ?" description="Le trait sera aussi retiré de tous les profils qui l’utilisent." confirmLabel="Supprimer" danger loading={saving} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />
    </>
  );
}
