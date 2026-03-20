import { describe, it, expect } from 'vitest';

// Validation logic that mirrors what Zod does in the action
// (Astro Actions themselves can't be unit-tested in isolation — they require Astro runtime)
function validateInquiryInput(data: { name: string; email: string; message: string }) {
  const errors: string[] = [];
  if (!data.name.trim()) errors.push('name');
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.push('email');
  if (data.message.trim().length < 10) errors.push('message');
  return errors;
}

describe('inquiry validation logic', () => {
  it('rejects empty name', () => {
    const errors = validateInquiryInput({ name: '', email: 'a@b.com', message: 'I am interested in this snake!' });
    expect(errors).toContain('name');
  });

  it('rejects invalid email', () => {
    const errors = validateInquiryInput({ name: 'Joe', email: 'notanemail', message: 'I am interested in this snake!' });
    expect(errors).toContain('email');
  });

  it('rejects short message', () => {
    const errors = validateInquiryInput({ name: 'Joe', email: 'joe@example.com', message: 'Hi' });
    expect(errors).toContain('message');
  });

  it('accepts valid input', () => {
    const errors = validateInquiryInput({ name: 'Joe', email: 'joe@example.com', message: 'I am very interested in this specimen.' });
    expect(errors).toHaveLength(0);
  });
});
