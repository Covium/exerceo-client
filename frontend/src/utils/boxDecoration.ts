import decorationSvg from '@/assets/BoxDecoration.svg?raw';

const cssVarPattern = /^var\((--[\w-]+)\)\s*$/;

export type BoxDecorationStyle = {
  '--box-decoration-color': string;
  '--box-decoration-image': string;
};

export function boxDecorationStyle(color: string): BoxDecorationStyle {
  return {
    '--box-decoration-color': color,
    '--box-decoration-image': boxDecorationImage(color),
  };
}

export function boxDecorationImage(color: string): string {
  const svg = decorationSvg.replaceAll('currentColor', resolveCssColor(color));
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function resolveCssColor(color: string): string {
  const trimmed = color.trim();
  const varName = cssVarPattern.exec(trimmed)?.[1];
  if (!varName || typeof document === 'undefined') {
    return trimmed;
  }

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim() || trimmed
  );
}
