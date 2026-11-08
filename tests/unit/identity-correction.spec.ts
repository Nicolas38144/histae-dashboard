import { latestAdultBirthdate, validIdentityCorrection } from '../../src/features/users/identity-correction';

const today = new Date('2026-11-08T12:00:00Z');
const correction = { firstname: 'Camille', birthdate: '1994-04-12', sex: null, reason: 'Demande vérifiée' };

describe('identity correction validation', () => {
  it('requires a justification for every correction and bounds first names', () => {
    expect(validIdentityCorrection(correction, today)).toBe(true);
    for (const reason of ['', 'ab', 'a'.repeat(501)]) expect(validIdentityCorrection({ ...correction, reason }, today)).toBe(false);
    for (const firstname of [' ', 'a'.repeat(101)]) expect(validIdentityCorrection({ ...correction, firstname }, today)).toBe(false);
    expect(validIdentityCorrection({ ...correction, firstname: '😀'.repeat(25) }, today)).toBe(true);
    expect(validIdentityCorrection({ ...correction, firstname: '😀'.repeat(26) }, today)).toBe(false);
  });

  it('requires a real calendar date and an adult at the current UTC date', () => {
    expect(latestAdultBirthdate(today)).toBe('2008-11-08');
    expect(latestAdultBirthdate(new Date('2024-02-29T12:00:00Z'))).toBe('2006-02-28');
    expect(validIdentityCorrection({ ...correction, birthdate: '2008-11-08' }, today)).toBe(true);
    for (const birthdate of ['2008-11-09', '2000-02-30', '2000-13-01', '2000-1-01', 'invalid', '2000-01-01T00:00:00Z']) {
      expect(validIdentityCorrection({ ...correction, birthdate }, today)).toBe(false);
    }
    expect(validIdentityCorrection({ ...correction, birthdate: '2000-02-29' }, today)).toBe(true);
  });
});
