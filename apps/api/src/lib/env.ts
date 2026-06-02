// 解析 PORT 环境变量，正确处理三个边界情况：
//   PORT='3000'  → 3000 (正常)
//   PORT='0'     → 0    (|| 会误判为 falsy 回退到 3000)
//   PORT=unset   → 3000 (?? 会因为 NaN 不触发回退)
export function resolvePort(raw: string | undefined): number {
  const num = Number(raw);
  return Number.isNaN(num) ? 3000 : num;
}
