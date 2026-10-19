const { hashPassword, verifyPassword } = require('../src/utils/password');

describe('password hashing (SRSSR-002)', () => {
  it('never returns the plain password', async () => {
    const hash = await hashPassword('Student@123');
    expect(hash).not.toBe('Student@123');
    expect(hash.startsWith('$2')).toBe(true); // bcrypt format
  });

  it('accepts the correct password', async () => {
    const hash = await hashPassword('Student@123');
    expect(await verifyPassword('Student@123', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Student@123');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('hashes the same password differently each time (salted)', async () => {
    const a = await hashPassword('Student@123');
    const b = await hashPassword('Student@123');
    expect(a).not.toBe(b);
  });
});
