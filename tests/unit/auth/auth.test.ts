import { describe, it, expect } from 'vitest';
import { isAdminRole } from '../../../src/lib/auth';

describe('isAdminRole', () => {
  it('returns true when publicMetadata.role is admin', () => {
    expect(isAdminRole({ publicMetadata: { role: 'admin' } })).toBe(true);
  });

  it('returns false for non-admin user', () => {
    expect(isAdminRole({ publicMetadata: { role: 'member' } })).toBe(false);
  });

  it('returns false when publicMetadata is empty', () => {
    expect(isAdminRole({ publicMetadata: {} })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdminRole(null)).toBe(false);
  });
});
