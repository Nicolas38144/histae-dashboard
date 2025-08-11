import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { getDaysSinceStartOfYear } from '../utils/general';
import type { PeriodTitle, PeriodToggleProps } from '../types/dataTableProps.type';

const periods: Record<PeriodTitle, { label: string; days: number }> = {
  today: { label: "Today", days: 0 },
  last7days: { label: '7 last days', days: 7 },
  lastmonth: { label: '30 last days', days: 30 },
  thisyear: { label: 'This year', days: getDaysSinceStartOfYear() },
  last12months: { label: '12 last months', days: 365 },
};

const PeriodToggle: React.FC<PeriodToggleProps> = ({ value, onChange }) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: PeriodTitle | null
  ) => {
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="Period"
      sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 3 }}
    >
      {Object.entries(periods).map(([key, period]) => (
        <ToggleButton key={key} value={key} aria-label={period.label}>
          {period.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export { periods };
export default PeriodToggle;
