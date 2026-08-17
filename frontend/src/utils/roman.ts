const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(value: number): string {
  if (value <= 0) {
    return 'N';
  }
  let remaining = Math.floor(value);
  let result = '';
  for (const [arabic, glyph] of ROMAN) {
    while (remaining >= arabic) {
      result += glyph;
      remaining -= arabic;
    }
  }
  return result;
}
