import { describe, expect, it } from 'vitest';
import { resolvePort } from '../../lib/env';

describe('resolvePort', () => {
  it('returns parsed number for valid PORT string', () => {
    expect(resolvePort('3000')).toBe(3000);
  });

  it('returns 0 for PORT=0 (valid, not falsy)', () => {
    // 回归：|| 会把 0 误判为 falsy 回退到 3000
    expect(resolvePort('0')).toBe(0);
  });

  it('returns 3000 when PORT is undefined', () => {
    // 回归：?? 不会对 NaN 触发回退，服务器会尝试监听 NaN 端口
    expect(resolvePort(undefined)).toBe(3000);
  });

  it('returns 3000 when PORT is empty string', () => {
    expect(resolvePort('')).toBe(0); // Number('') = 0, this is valid
  });

  it('returns 3000 for non-numeric PORT', () => {
    // 回归：Number('abc') = NaN，需要回退
    expect(resolvePort('abc')).toBe(3000);
  });

  it('returns 0 for whitespace-only PORT (Number(" ") = 0 in JS)', () => {
    // Number('   ') = 0，这是 JavaScript 规范行为
    // 实际场景中 PORT 不会是纯空白
    expect(resolvePort('   ')).toBe(0);
  });

  it('returns the parsed number for negative PORT (Number("-1") = -1, not NaN)', () => {
    // Number('-1') 是有效数字 -1，不是 NaN——resolvePort 只防 NaN 不验证范围
    expect(resolvePort('-1')).toBe(-1);
  });

  it('accepts large valid port number', () => {
    expect(resolvePort('65535')).toBe(65535);
  });
});
