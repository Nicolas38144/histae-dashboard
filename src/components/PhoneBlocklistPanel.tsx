import { useCallback, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { getPhoneBlocklist, PHONE_BLOCKLIST_PAGE_SIZE } from '../api/phone-blocklist';
import { errorMessage } from '../api/client';
import { usePhonePolicy } from '../features/phone-blocklist/use-phone-policy';
import { useAsyncData } from '../hooks/useAsyncData';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { formatDate, formatNumber } from '../utils/format';
import { AsyncState } from './AsyncState';
import { PhonePolicyDialog } from './PhonePolicyDialog';

const decisionMessages = { automatic: 'phoneBlocklist.automatic', block: 'phoneBlocklist.block', allow: 'phoneBlocklist.allow' } as const;

export function PhoneBlocklistPanel({ isSuperadmin }: { isSuperadmin: boolean }) {
  useLocale();
  const [offset, setOffset] = useState(0);
  const load = useCallback(() => getPhoneBlocklist(offset), [offset]);
  const { data, error, loading, reload } = useAsyncData(load);
  const [phone, setPhone] = useState('');
  const { review, looking, saving, error: actionError, open, close, search, save } = usePhonePolicy(reload);
  return <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
    <Typography variant="h6" component="h2" gutterBottom>{t('phoneBlocklist.title')}</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>{t('phoneBlocklist.description')}</Typography>
    <AsyncState loading={loading && !data} error={error} onRetry={reload} />
    {actionError !== null && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(actionError)}</Alert>}
    {data && <>
      {!data.ready && <Alert severity="error" sx={{ mb: 2 }}>{t('phoneBlocklist.notReady')}</Alert>}
      <Stack spacing={1} sx={{ mb: 2 }}>{data.sources.map((source) => <Box key={source.source}>
        <Typography variant="body2">{t('phoneBlocklist.sourceStatus', { source: source.source, date: formatDate(source.last_success_at), count: formatNumber(source.imported_count) })}</Typography>
        {source.last_error && <Alert severity="warning">{t('phoneBlocklist.sourceFailed')}</Alert>}
      </Box>)}</Stack>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); void search(phone); }} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField label={t('phoneBlocklist.phone')} value={phone} type="tel" size="small" autoComplete="off" slotProps={{ htmlInput: { maxLength: 64 } }}
          onChange={(event) => setPhone(event.target.value)} disabled={looking || saving} />
        <Button type="submit" disabled={looking || saving || !phone.trim()}>{t('phoneBlocklist.lookup')}</Button>
        <Button onClick={reload} disabled={loading || saving}>{t('phoneBlocklist.refresh')}</Button>
      </Box>
      <TableContainer><Table size="small">
        <TableHead><TableRow>
          <TableCell>{t('phoneBlocklist.phone')}</TableCell><TableCell>{t('phoneBlocklist.status')}</TableCell>
          <TableCell>{t('phoneBlocklist.decision')}</TableCell><TableCell>{t('phoneBlocklist.until')}</TableCell>
          <TableCell>{t('phoneBlocklist.observations')}</TableCell><TableCell>{t('phoneBlocklist.actions')}</TableCell>
        </TableRow></TableHead>
        <TableBody>{data.entries.map((entry) => <TableRow key={entry.id}>
          <TableCell title={entry.id ?? undefined}>{entry.phone_hint}</TableCell>
          <TableCell><Chip size="small" color={entry.blocked ? 'warning' : 'success'} label={entry.blocked ? t('phoneBlocklist.blocked') : t('phoneBlocklist.unblocked')} /></TableCell>
          <TableCell>{t(decisionMessages[entry.decision])}</TableCell>
          <TableCell>{formatDate(entry.decision_until)}</TableCell>
          <TableCell>{entry.observations.map((observation) => <Typography key={observation.source} variant="body2">
            {t('phoneBlocklist.observation', { source: observation.source, date: formatDate(observation.last_seen_at), until: formatDate(observation.expires_at) })}
          </Typography>)}</TableCell>
          <TableCell><Button disabled={loading || looking || saving || Boolean(error) || !entry.id}
            onClick={() => open(entry)}>{t('phoneBlocklist.review')}</Button></TableCell>
        </TableRow>)}</TableBody>
      </Table></TableContainer>
      {!data.entries.length && <Typography sx={{ my: 2 }}>{t('phoneBlocklist.empty')}</Typography>}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
        <Button disabled={loading || saving || offset === 0} onClick={() => setOffset((value) => Math.max(0, value - PHONE_BLOCKLIST_PAGE_SIZE))}>{t('phoneBlocklist.previous')}</Button>
        <Typography>{t('phoneBlocklist.total', { count: data.total })}</Typography>
        <Button disabled={loading || saving || offset + PHONE_BLOCKLIST_PAGE_SIZE >= data.total} onClick={() => setOffset((value) => value + PHONE_BLOCKLIST_PAGE_SIZE)}>{t('phoneBlocklist.next')}</Button>
      </Box>
    </>}
    {review && <PhonePolicyDialog key={review.entry.id ?? review.target.phone_number} entry={review.entry} target={review.target} isSuperadmin={isSuperadmin}
      saving={saving} onSave={(change) => { void save(change); }} onClose={close} />}
  </Paper>;
}
