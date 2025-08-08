import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { getDaysSinceStartOfYear } from '../utils/general';

export type PeriodTitle = 'today' | 'last7days' | 'lastmonth' | 'thisyear' | 'last12months';

const periods: Record<PeriodTitle, { label: string; days: number }> = {
  today: { label: "Aujourd'hui", days: 0 },
  last7days: { label: '7 derniers jours', days: 7 },
  lastmonth: { label: '30 derniers jours', days: 30 },
  thisyear: { label: 'Cette année', days: getDaysSinceStartOfYear() },
  last12months: { label: '12 derniers mois', days: 365 },
};

interface PeriodToggleProps {
  value: PeriodTitle;
  onChange: (newValue: PeriodTitle) => void;
}

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
      aria-label="Période"
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
