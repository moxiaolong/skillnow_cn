export function bayesianScore(up: number, down: number): number {
  const safeUp = Math.max(0, Number(up) || 0);
  const safeDown = Math.max(0, Number(down) || 0);
  return (safeUp + 2.5) / (safeUp + safeDown + 5);
}

export function upRatio(up: number, down: number): number {
  const total = Math.max(0, up) + Math.max(0, down);
  return total > 0 ? Math.round((Math.max(0, up) / total) * 100) : 0;
}
