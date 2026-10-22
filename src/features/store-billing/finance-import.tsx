import { Alert, Box, Button, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { errorMessage } from '../../api/client';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import { t } from '../../i18n/core';
import { formatMoney } from '../../utils/format';
import type { StoreProvider } from './types';
import { financeTotals } from './finance-csv';
import { storeProviderLabel } from './labels';
import { useFinanceImport } from './use-finance-import';

export function StoreFinanceImport({ onImported }: { onImported: () => void }) {
  const { provider, setProvider, reportId, setReportId, rows, confirm, setConfirm, saving, actionError, imported, setImported, readFile, submit } = useFinanceImport(onImported);
  const label = storeProviderLabel;
  return <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6">{t('storeBilling.import')}</Typography><Typography sx={{ my: 1 }}>{t('storeBilling.recentAuth')}</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', my: 2 }}>
        <Select value={provider} disabled={saving || confirm !== null} onChange={(event) => { setProvider(event.target.value as StoreProvider); setImported(false); }} inputProps={{ 'aria-label': t('storeBilling.provider') }}>
          <MenuItem value="app_store">{t('storeBilling.apple')}</MenuItem><MenuItem value="google_play">{t('storeBilling.google')}</MenuItem>
        </Select>
        <TextField label={t('storeBilling.reportId')} value={reportId} disabled={saving || confirm !== null} onChange={(event) => { setReportId(event.target.value); setImported(false); }} inputProps={{ maxLength: 128 }} />
        <Button component="label" disabled={saving || confirm !== null}>{t('storeBilling.file')}<input hidden type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} /></Button>
        <Button component="a" href="/store-finance-template.csv" download>{t('storeBilling.template')}</Button>
      </Box>
      {actionError !== null && <Alert severity="error">{errorMessage(actionError)}</Alert>}
      {imported && <Alert severity="success">{t('storeBilling.imported')}</Alert>}
      {rows.length > 0 && <>
        <Alert severity="warning" sx={{ mb: 2 }}>{t('storeBilling.preview', { count: rows.length })}</Alert>
        <Box sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>{t('storeBilling.gross')}</TableCell><TableCell>{t('storeBilling.net')}</TableCell></TableRow></TableHead>
          <TableBody>{financeTotals(rows).map((total) => <TableRow key={total.currency}>
              <TableCell>{formatMoney(total.gross, total.currency)}</TableCell>
              <TableCell>{total.net === null ? t('common.missing') : formatMoney(total.net, total.currency)}</TableCell>
            </TableRow>)}</TableBody></Table></Box>
      </>}
      <Button sx={{ mt: 2 }} variant="contained" disabled={saving || !rows.length || !/^[A-Za-z0-9_.:-]{1,128}$/.test(reportId)} onClick={() => setConfirm({ provider, reportId, rows: rows.map((row) => ({ ...row })) })}>{t('storeBilling.import')}</Button>
      <ConfirmActionDialog open={confirm !== null} title={t('storeBilling.confirm')} description={t('storeBilling.confirmDetails', { provider: confirm ? label(confirm.provider) : '', report: confirm?.reportId ?? '', count: confirm?.rows.length ?? 0 })} confirmLabel={t('common.confirm')} loading={saving} onCancel={() => setConfirm(null)} onConfirm={submit} />
    </Paper>;
}
