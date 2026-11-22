export const CASE_REPLY_MAX_LENGTH = 1_000;

export function validateCaseReply(input: string, required = true) {
  const text = input.trim();
  if (required && !text) return 'required';
  if ([...text].length > CASE_REPLY_MAX_LENGTH) return 'too_long';
  if (/\p{Cc}/u.test(text.replace(/[\r\n\t]/g, ''))) return 'invalid_characters';
  return null;
}
