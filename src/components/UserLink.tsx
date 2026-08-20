import { Link, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { compactId } from '../utils/format';

export function UserLink({ id, label }: { id: string; label?: string | null }) {
  return <Tooltip title={id}><Link component={RouterLink} to={`/users/${id}`}>{label || compactId(id)}</Link></Tooltip>;
}

