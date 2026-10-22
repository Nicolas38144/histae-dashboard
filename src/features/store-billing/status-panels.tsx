import { storeProviderLabel } from './labels';
import { Alert, Box, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { RevenuePeriod } from '../../api/types';
import { UserLink } from '../../components/UserLink';
import { t } from '../../i18n/core';
import { domainLabel } from '../../i18n/domain';
import { formatDate, formatMoney, formatNumber } from '../../utils/format';
import type { StoreBillingStatus } from './types';


export function StoreBillingPanels({ data, period, setPeriod }: { data: StoreBillingStatus; period: RevenuePeriod; setPeriod: (period: RevenuePeriod) => void }) {
  const label = storeProviderLabel;
  return <>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        {(['app_store', 'google_play'] as const).map((provider) => {
          const source = data.sources.find((item) => item.provider === provider);
          return <Paper variant="outlined" sx={{ p: 3 }} key={provider}>
            <Typography variant="h6">{label(provider)}</Typography>
            {!data.enabled[provider] && <Alert severity="info">{t('storeBilling.disabled')}</Alert>}
            <Typography>{t('storeBilling.metric', { label: t('storeBilling.subscriptions'), value: formatNumber(source?.subscriptions ?? 0) })}</Typography>
            <Typography>{t('storeBilling.metric', { label: t('storeBilling.active'), value: formatNumber(source?.active_accounts ?? 0) })}</Typography>
            <Typography>{t('storeBilling.metric', { label: t('storeBilling.unacknowledged'), value: formatNumber(source?.unacknowledged ?? 0) })}</Typography>
            <Typography>{t('storeBilling.metric', { label: t('storeBilling.lastVerified'), value: source?.last_verified_at ? formatDate(source.last_verified_at) : t('storeBilling.noVerification') })}</Typography>
          </Paper>;
        })}
      </Box>
      {(data.pending_notifications > 0 || data.dead_letters > 0) && <Alert severity="warning" sx={{ mt: 2 }}>
        {t('storeBilling.metric', { label: t('storeBilling.pending'), value: formatNumber(data.pending_notifications) })}<br />{t('storeBilling.metric', { label: t('storeBilling.deadLetters'), value: formatNumber(data.dead_letters) })}
      </Alert>}
      <Paper variant="outlined" sx={{ p: 3, mt: 3, overflowX: 'auto' }}>
        <Typography variant="h6">{t('storeBilling.finance')}</Typography>
        <Typography sx={{ my: 2 }}>{t('storeBilling.financeNotice')}</Typography>
        <Select value={period} onChange={(event) => setPeriod(event.target.value as RevenuePeriod)} inputProps={{ 'aria-label': t('storeBilling.range') }}>
          <MenuItem value="last_7_days">{t('common.last7Days')}</MenuItem>
          <MenuItem value="last_30_days">{t('common.last30Days')}</MenuItem>
          <MenuItem value="all_time">{t('common.allTime')}</MenuItem>
        </Select>
        {!data.finance.length ? <Alert severity="info" sx={{ my: 2 }}>{t('storeBilling.noFinance')}</Alert> : <Table>
          <TableHead><TableRow>{[t('storeBilling.provider'), t('storeBilling.gross'), t('storeBilling.net'), t('storeBilling.lastImport')].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{data.finance.map((row) => <TableRow key={`${row.provider}-${row.currency}`}>
            <TableCell>{label(row.provider)}</TableCell><TableCell>{formatMoney(row.gross_cents, row.currency)}</TableCell>
            <TableCell>{row.net_cents === null ? t('common.missing') : formatMoney(row.net_cents, row.currency)}</TableCell><TableCell>{formatDate(row.last_imported_at)}</TableCell>
          </TableRow>)}</TableBody>
        </Table>}
        <Typography sx={{ mt: 2 }}>{t('storeBilling.stripeNotice')}</Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 3, mt: 3, overflowX: 'auto' }}>
        <Typography variant="h6">{t('storeBilling.recent')}</Typography>
        <Table><TableHead><TableRow>{[t('storeBilling.account'), t('storeBilling.provider'), t('storeBilling.period'), t('storeBilling.status'), t('storeBilling.expires'), t('storeBilling.autoRenew')].map((label) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
          <TableBody>{data.recent.map((row) => <TableRow key={`${row.provider}-${row.user_id}-${row.verified_at}`}>
            <TableCell><UserLink id={row.user_id} /></TableCell><TableCell>{label(row.provider)}</TableCell><TableCell>{domainLabel(row.billing_period)}</TableCell><TableCell>{domainLabel(row.status)}</TableCell><TableCell>{formatDate(row.expires_at)}</TableCell><TableCell>{row.auto_renew ? t('storeBilling.yes') : t('storeBilling.no')}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </Paper>
  </>;
}
