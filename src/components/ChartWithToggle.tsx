import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Box, FormControlLabel, Checkbox, FormGroup, Typography } from '@mui/material';
import type { IChartData } from '../types/metric.interface';
import { t } from 'i18next';

type MetricKey =
  | 'nb_publication_liked'
  | 'nb_match'
  | 'nb_match_not_continued'
  | 'nb_match_continued'
  | 'nb_match_report'
  | 'nb_publication'
  | 'nb_publication_report'
  | 'nb_user';

type Props = {
  data: IChartData[];
  title: string;
};

const COLORS: Record<MetricKey, string> = {
  nb_publication_liked: '#1f77b4',
  nb_match: '#ff7f0e',
  nb_match_not_continued: '#2ca02c',
  nb_match_continued: '#17becf',
  nb_match_report: '#d62728',
  nb_publication: '#8c564b',
  nb_publication_report: '#e377c2',
  nb_user: '#7f7f7f',
};


const LABELS: Record<MetricKey, string> = {
  nb_publication_liked: 'Publications liked',
  nb_match: 'Matches created',
  nb_match_not_continued: 'Matches not continued',
  nb_match_continued: 'Matches continued',
  nb_match_report: 'Match reports',
  nb_publication: 'Publications',
  nb_publication_report: 'Publication reports',
  nb_user: 'Users',
};

const ChartWithToggle = ({ data, title }: Props) => {
  if (!data || data.length === 0) {
    return <Typography variant="body1" sx={{ textAlign: 'center', mt: 40 }}>
      {t("chartWithToggle.noData")}
    </Typography>;
  }  const allKeys = Object.keys(data[0]).filter(k => k !== 'day') as MetricKey[];

  const [visibleLines, setVisibleLines] = useState<Record<MetricKey, boolean>>(
    allKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as Record<MetricKey, boolean>)
  );

  const handleToggle = (key: MetricKey) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box sx={{ width: '100%', height: 400, mt: 6 }}>
      <Typography variant="h6" textAlign='center'>
        {t("chartWithToggle.statistics")} {title}
      </Typography>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
            minTickGap={15}
          />
          <YAxis allowDecimals={false} />
          <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
          {/* <Legend /> */}
          {allKeys.map((key) =>
            visibleLines[key] ? (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[key]}
                strokeWidth={2}
                dot={false}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>

      <FormGroup row sx={{ mb: 2, justifyContent: 'center', gap: 5 }}>
        {allKeys.map((key) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={visibleLines[key]}
                onChange={() => handleToggle(key)}
                sx={{ color: COLORS[key], '&.Mui-checked': { color: COLORS[key] } }}
              />
            }
            label={LABELS[key]}
          />
        ))}
      </FormGroup>

    </Box>
  );
};

export default ChartWithToggle;
