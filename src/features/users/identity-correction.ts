import type { ProfileIdentityCorrection } from '../../api/types';

export function latestAdultBirthdate(today = new Date()): string {
  const year = today.getUTCFullYear() - 18;
  const month = today.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(today.getUTCDate(), lastDay);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function validIdentityCorrection(correction: ProfileIdentityCorrection, today = new Date()): boolean {
  const nameLength = new TextEncoder().encode(correction.firstname.trim()).byteLength;
  const reasonLength = correction.reason.trim().length;
  const date = new Date(`${correction.birthdate}T00:00:00Z`);
  return nameLength > 0 && nameLength <= 100
    && reasonLength >= 3 && reasonLength <= 500
    && /^\d{4}-\d{2}-\d{2}$/.test(correction.birthdate)
    && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === correction.birthdate
    && correction.birthdate <= latestAdultBirthdate(today);
}
