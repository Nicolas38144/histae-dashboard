import { Link, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { resolveUserName } from '../utils/userNames';

export function UserLink({ id, label }: { id: string; label?: string | null }) {
  const [resolved, setResolved] = useState<{ id: string; name: string | null } | null>(null);
  useEffect(() => {
    if (label) return;
    let active = true;
    void resolveUserName(id).then((name) => {
      if (active) setResolved({ id, name });
    });
    return () => { active = false; };
  }, [id, label]);
  const name = label || (resolved?.id === id ? resolved.name : null);
  return <Tooltip title={id} describeChild><Link component={RouterLink} to={`/users/${id}`}>{name || 'Prénom non renseigné'}</Link></Tooltip>;
}
