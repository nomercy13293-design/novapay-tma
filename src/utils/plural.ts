/**
 * Корректное русское склонение числительных
 * Пример: pluralize(3, 'операция', 'операции', 'операций') -> '3 операции'
 */
export function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${n} ${many}`;
  if (rem > 1 && rem < 5) return `${n} ${few}`;
  if (rem === 1) return `${n} ${one}`;
  return `${n} ${many}`;
}
