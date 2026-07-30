import { describe, it, expect } from 'vitest';
import { inquiryFormSchema } from '../../../src/lib/forms';

const validInquiry = {
  snakeId: 'snake-1',
  name: 'Joe',
  email: 'joe@example.com',
  message: 'I am very interested in this specimen.',
  website: '',
};

describe('inquiryFormSchema', () => {
  it('rejects empty name', () => {
    expect(inquiryFormSchema.safeParse({ ...validInquiry, name: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(inquiryFormSchema.safeParse({ ...validInquiry, email: 'notanemail' }).success).toBe(false);
  });

  it('rejects short message', () => {
    expect(inquiryFormSchema.safeParse({ ...validInquiry, message: 'Hi' }).success).toBe(false);
  });

  it('normalizes valid email addresses', () => {
    const result = inquiryFormSchema.safeParse({
      ...validInquiry,
      email: '  JOE@EXAMPLE.COM ',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('joe@example.com');
  });

  it('rejects a filled bot honeypot', () => {
    expect(inquiryFormSchema.safeParse({
      ...validInquiry,
      website: 'https://spam.example',
    }).success).toBe(false);
  });
});
