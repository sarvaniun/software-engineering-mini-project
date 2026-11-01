jest.mock('mysql2/promise', () => {
  const conn = { query: jest.fn(), beginTransaction: jest.fn(), commit: jest.fn(), rollback: jest.fn(), release: jest.fn() };
  return { createPool: () => ({ getConnection: async () => conn }), conn };
});

const { conn } = require('mysql2/promise');
const db = require('../src/config/db');

beforeEach(() => Object.values(conn).forEach((fn) => fn.mockReset()));

describe('db.transaction (SRSSR-004: audit rows commit with their change)', () => {
  it('commits and releases the connection when the callback succeeds', async () => {
    const result = await db.transaction(async (tx) => {
      await tx.query('INSERT INTO students (roll_no) VALUES (?)', ['R1']);
      return 'done';
    });
    expect(result).toBe('done');
    expect(conn.commit).toHaveBeenCalled();
    expect(conn.rollback).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });

  it('rolls back, rethrows and releases when the callback fails', async () => {
    await expect(db.transaction(async () => { throw new Error('audit insert failed'); }))
      .rejects.toThrow('audit insert failed');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.commit).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalled();
  });
});
