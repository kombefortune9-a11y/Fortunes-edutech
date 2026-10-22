/**
 * PDF Sanitizer and Color Converter for html2canvas / html2pdf.js
 * Converts modern CSS colors (oklab, oklch, color(oklab ...), color(oklch ...), color-mix, etc.)
 * into standard rgb/rgba formats compatible with html2canvas CSS parser.
 */

export function oklabToRgbString(L: number, a: number, b: number, alpha: number): string {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const gamma = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  const R = Math.max(0, Math.min(255, Math.round(gamma(r_lin) * 255)));
  const G = Math.max(0, Math.min(255, Math.round(gamma(g_lin) * 255)));
  const B = Math.max(0, Math.min(255, Math.round(gamma(b_lin) * 255)));

  if (alpha === 1 || isNaN(alpha)) {
    return `rgb(${R}, ${G}, ${B})`;
  } else {
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
}

export function oklToRgb(str: string): string {
  try {
    const lower = str.toLowerCase().trim();
    if (lower.includes('oklch')) {
      const match = str.match(/oklch\(\s*([0-9.-]+%?|none)\s+([0-9.-]+%?|none)\s+([0-9.-]+(?:deg|rad|grad|turn)?|none)(?:\s*[\/,\s]\s*([0-9.-]+%?|none))?\s*\)/i) ||
                    str.match(/color\(\s*oklch\s+([0-9.-]+%?|none)\s+([0-9.-]+%?|none)\s+([0-9.-]+(?:deg|rad|grad|turn)?|none)(?:\s*[\/,\s]\s*([0-9.-]+%?|none))?\s*\)/i);
      if (match) {
        const L_str = match[1] === 'none' ? '0' : match[1];
        const C_str = match[2] === 'none' ? '0' : match[2];
        const H_str = match[3] === 'none' ? '0' : match[3];
        const A_str = match[4] === 'none' ? '1' : match[4];

        let L = L_str.includes('%') ? parseFloat(L_str) / 100 : parseFloat(L_str);
        let C = C_str.includes('%') ? parseFloat(C_str) / 100 : parseFloat(C_str);
        
        let H = parseFloat(H_str);
        if (H_str.includes('rad')) {
          H = H * (180 / Math.PI);
        } else if (H_str.includes('turn')) {
          H = H * 360;
        } else if (H_str.includes('grad')) {
          H = H * 0.9;
        }

        let alpha = 1;
        if (A_str) {
          alpha = A_str.includes('%') ? parseFloat(A_str) / 100 : parseFloat(A_str);
        }

        if (isNaN(L)) L = 0;
        if (isNaN(C)) C = 0;
        if (isNaN(H)) H = 0;
        if (isNaN(alpha)) alpha = 1;

        const hueRad = (H * Math.PI) / 180;
        const a = C * Math.cos(hueRad);
        const b = C * Math.sin(hueRad);

        return oklabToRgbString(L, a, b, alpha);
      }
    } else if (lower.includes('oklab')) {
      const match = str.match(/oklab\(\s*([0-9.-]+%?|none)\s+([0-9.-]+%?|none)\s+([0-9.-]+%?|none)(?:\s*[\/,\s]\s*([0-9.-]+%?|none))?\s*\)/i) ||
                    str.match(/color\(\s*oklab\s+([0-9.-]+%?|none)\s+([0-9.-]+%?|none)\s+([0-9.-]+%?|none)(?:\s*[\/,\s]\s*([0-9.-]+%?|none))?\s*\)/i);

      if (match) {
        const L_str = match[1] === 'none' ? '0' : match[1];
        const a_str = match[2] === 'none' ? '0' : match[2];
        const b_str = match[3] === 'none' ? '0' : match[3];
        const A_str = match[4] === 'none' ? '1' : match[4];

        let L = L_str.includes('%') ? parseFloat(L_str) / 100 : parseFloat(L_str);
        let a = a_str.includes('%') ? (parseFloat(a_str) / 100) * 0.4 : parseFloat(a_str);
        let b = b_str.includes('%') ? (parseFloat(b_str) / 100) * 0.4 : parseFloat(b_str);
        
        let alpha = 1;
        if (A_str) {
          alpha = A_str.includes('%') ? parseFloat(A_str) / 100 : parseFloat(A_str);
        }

        if (isNaN(L)) L = 0;
        if (isNaN(a)) a = 0;
        if (isNaN(b)) b = 0;
        if (isNaN(alpha)) alpha = 1;

        return oklabToRgbString(L, a, b, alpha);
      }
    }
  } catch (err) {
    console.error("oklToRgb error:", err);
  }
  return 'transparent';
}

function replaceFunctionWithBalancedParens(css: string, funcName: string, replacer: (fullExpr: string) => string): string {
  const target = funcName.toLowerCase() + '(';
  const lowerCss = css.toLowerCase();
  let result = '';
  let i = 0;
  while (i < css.length) {
    const nextIdx = lowerCss.indexOf(target, i);
    if (nextIdx === -1) {
      result += css.slice(i);
      break;
    }
    result += css.slice(i, nextIdx);
    let depth = 1;
    let j = nextIdx + target.length;
    while (j < css.length && depth > 0) {
      if (css[j] === '(') depth++;
      else if (css[j] === ')') depth--;
      j++;
    }
    let fullExpr = css.slice(nextIdx, j);
    if (depth > 0) {
      fullExpr += ')'.repeat(depth);
    }
    result += replacer(fullExpr);
    i = j;
  }
  return result;
}

const cssCleanupCache = new Map<string, string>();

export function replaceOklColorsInCss(cssText: string): string {
  if (!cssText) return cssText;
  if (cssCleanupCache.has(cssText)) return cssCleanupCache.get(cssText)!;

  try {
    let cleaned = cssText;

    // Fast check if anything needs cleaning
    const hasOkl = cleaned.includes('okl');
    const hasMix = cleaned.includes('color-mix');
    const hasColor = cleaned.includes('color(');
    const hasLightDark = cleaned.includes('light-dark(');
    const hasGrad = cleaned.includes('gradient');

    if (!hasOkl && !hasMix && !hasColor && !hasLightDark && !hasGrad) return cssText;

    // 1. Handle light-dark() - extract light mode color (first argument)
    if (hasLightDark) {
      cleaned = replaceFunctionWithBalancedParens(cleaned, 'light-dark', (expr) => {
        const inner = expr.slice(11, -1);
        const parts = inner.split(',');
        return parts[0]?.trim() || 'inherit';
      });
    }

    // 2. Handle color-mix - replace with transparent or safe neutral fallback to prevent crashes
    if (hasMix) {
      cleaned = replaceFunctionWithBalancedParens(cleaned, 'color-mix', () => 'transparent');
    }

    // 3. Replace oklch(...)
    if (hasOkl && cleaned.includes('oklch')) {
      cleaned = replaceFunctionWithBalancedParens(cleaned, 'oklch', (expr) => {
        const converted = oklToRgb(expr);
        return converted.toLowerCase().includes('oklch') ? 'transparent' : converted;
      });
    }

    // 4. Replace oklab(...)
    if (hasOkl && cleaned.includes('oklab')) {
      cleaned = replaceFunctionWithBalancedParens(cleaned, 'oklab', (expr) => {
        const converted = oklToRgb(expr);
        return converted.toLowerCase().includes('oklab') ? 'transparent' : converted;
      });
    }

    // 5. Replace color(...)
    if (hasColor) {
      cleaned = replaceFunctionWithBalancedParens(cleaned, 'color', (expr) => {
        const lower = expr.toLowerCase();
        if (lower.includes('srgb')) {
          const match = expr.match(/color\(\s*srgb\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)(?:\s*\/\s*([0-9.-]+))?\s*\)/i);
          if (match) {
            const R = Math.max(0, Math.min(255, Math.round(parseFloat(match[1]) * 255)));
            const G = Math.max(0, Math.min(255, Math.round(parseFloat(match[2]) * 255)));
            const B = Math.max(0, Math.min(255, Math.round(parseFloat(match[3]) * 255)));
            const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
            return alpha === 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${alpha})`;
          }
        }
        if (lower.includes('oklch') || lower.includes('oklab')) {
          return oklToRgb(expr);
        }
        return 'transparent';
      });
    }

    // 6. Strip modern gradient syntaxes that html2canvas fails on
    if (hasGrad && (cleaned.includes('in ') || cleaned.includes('oklch') || cleaned.includes('oklab'))) {
      cleaned = cleaned.replace(/linear-gradient\([^)]*oklch[^)]*\)/gi, 'none');
      cleaned = cleaned.replace(/linear-gradient\([^)]*oklab[^)]*\)/gi, 'none');
    }

    // 7. Absolute catch-all guarantee: No oklch / oklab survives
    if (cleaned.includes('oklch(')) {
      cleaned = cleaned.replace(/oklch\([^)]*\)/gis, (match) => {
        const converted = oklToRgb(match);
        return converted.toLowerCase().includes('oklch') ? 'transparent' : converted;
      });
    }
    if (cleaned.includes('oklab(')) {
      cleaned = cleaned.replace(/oklab\([^)]*\)/gis, (match) => {
        const converted = oklToRgb(match);
        return converted.toLowerCase().includes('oklab') ? 'transparent' : converted;
      });
    }
    if (cleaned.includes('color-mix(')) {
      cleaned = cleaned.replace(/color-mix\([^)]*\)/gis, 'transparent');
    }
    if (cleaned.includes('color(')) {
      cleaned = cleaned.replace(/color\(\s*oklch[^)]*\)/gis, 'transparent');
      cleaned = cleaned.replace(/color\(\s*oklab[^)]*\)/gis, 'transparent');
    }

    cssCleanupCache.set(cssText, cleaned);
    return cleaned;
  } catch (err) {
    return cssText;
  }
}

export function createStyleProxy(realStyle: CSSStyleDeclaration): CSSStyleDeclaration {
  if (!realStyle) return realStyle;

  return new Proxy(realStyle, {
    get(target, prop) {
      if (prop === 'getPropertyValue') {
        return (propertyName: string) => {
          try {
            const val = target.getPropertyValue(propertyName);
            if (val && typeof val === 'string' && (val.includes('okl') || val.includes('color(') || val.includes('color-mix'))) {
              return replaceOklColorsInCss(val);
            }
            return val;
          } catch {
            return '';
          }
        };
      }

      if (prop === 'getPropertyPriority') {
        return (propertyName: string) => {
          try {
            return target.getPropertyPriority(propertyName);
          } catch {
            return '';
          }
        };
      }

      if (prop === 'item') {
        return (index: number) => {
          try {
            return target.item(index);
          } catch {
            return '';
          }
        };
      }

      if (prop === 'setProperty') {
        return (propertyName: string, value: string, priority?: string) => {
          try {
            target.setProperty(propertyName, value, priority);
          } catch {
            // ignore
          }
        };
      }

      if (prop === 'removeProperty') {
        return (propertyName: string) => {
          try {
            return target.removeProperty(propertyName);
          } catch {
            return '';
          }
        };
      }

      try {
        // Access directly on target so native getters are invoked with `this = target` (not the Proxy receiver)
        const val = (target as any)[prop];
        if (typeof val === 'function') {
          return val.bind(target);
        }
        if (typeof val === 'string' && (val.includes('okl') || val.includes('color(') || val.includes('color-mix'))) {
          return replaceOklColorsInCss(val);
        }
        return val;
      } catch {
        return undefined;
      }
    },
    set(target, prop, value) {
      try {
        (target as any)[prop] = value;
        return true;
      } catch {
        return false;
      }
    },
    has(target, prop) {
      return prop in target;
    },
    ownKeys(target) {
      try {
        return Reflect.ownKeys(target);
      } catch {
        return [];
      }
    },
    getOwnPropertyDescriptor(target, prop) {
      try {
        return Object.getOwnPropertyDescriptor(target, prop);
      } catch {
        return undefined;
      }
    }
  });
}

/**
 * Temporarily hooks window.getComputedStyle and injects print page styling.
 * Returns a restore function that resets original state without corrupting host styles.
 */
export function prepareDocumentForPdfExport(isPortrait?: boolean): () => void {
  cssCleanupCache.clear();
  
  // 1. Temporarily hook window.getComputedStyle in the main window
  const origWindowGetComputedStyle = window.getComputedStyle ? window.getComputedStyle.bind(window) : null;
  if (origWindowGetComputedStyle) {
    window.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
      try {
        if (!elt) return origWindowGetComputedStyle(document.body, pseudoElt);
        const realStyle = origWindowGetComputedStyle(elt, pseudoElt);
        return realStyle ? createStyleProxy(realStyle) : realStyle;
      } catch {
        return origWindowGetComputedStyle ? origWindowGetComputedStyle(elt, pseudoElt) : ({} as CSSStyleDeclaration);
      }
    };
  }

  // 2. Inject dynamic page print orientation style element
  const dynamicStyle = document.createElement('style');
  dynamicStyle.id = 'dynamic-pdf-page-style';
  dynamicStyle.textContent = `
    @media print {
      @page {
        size: A4 ${isPortrait ? 'portrait' : 'landscape'} !important;
        margin: 4mm !important;
      }
      tr, tbody tr, .scheme-table tr, .weekly-forecast-table tr, .doc-type-schemes_of_work tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;
  document.head.appendChild(dynamicStyle);

  return () => {
    // Restore window.getComputedStyle
    if (origWindowGetComputedStyle) {
      window.getComputedStyle = origWindowGetComputedStyle;
    }

    // Remove dynamic page print style
    const styleEl = document.getElementById('dynamic-pdf-page-style');
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    cssCleanupCache.clear();
  };
}

/**
 * Callback function for html2canvas onclone option to clean the cloned DOM document.
 */
export function sanitizeClonedDoc(clonedDoc: Document) {
  cssCleanupCache.clear();
  const win = clonedDoc.defaultView;

  // 1. Clean <style> tag content in cloned document
  const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
  styleElements.forEach((styleEl) => {
    if (styleEl.textContent && (styleEl.textContent.includes('okl') || styleEl.textContent.includes('color(') || styleEl.textContent.includes('color-mix') || styleEl.textContent.includes('gradient'))) {
      const parent = styleEl.parentNode;
      const cleanedText = replaceOklColorsInCss(styleEl.textContent);
      const newStyle = clonedDoc.createElement('style');
      newStyle.textContent = cleanedText;
      if (parent) {
        parent.replaceChild(newStyle, styleEl);
      } else {
        styleEl.textContent = cleanedText;
      }
    }
  });

  // 2. Clean inline style attributes on elements that have them
  const elementsWithStyles = clonedDoc.querySelectorAll('[style]');
  elementsWithStyles.forEach((node) => {
    const el = node as HTMLElement;
    if (el.style && el.style.cssText && (el.style.cssText.includes('okl') || el.style.cssText.includes('color(') || el.style.cssText.includes('color-mix') || el.style.cssText.includes('gradient'))) {
      el.style.cssText = replaceOklColorsInCss(el.style.cssText);
    }
  });

  // 3. Proxy getComputedStyle on cloned document iframe window
  if (win && win.getComputedStyle) {
    const origGetComputedStyle = win.getComputedStyle.bind(win);
    win.getComputedStyle = function(elt: Element, pseudoElt?: string | null) {
      try {
        if (!elt) return origGetComputedStyle(clonedDoc.body, pseudoElt);
        const realStyle = origGetComputedStyle(elt, pseudoElt);
        return realStyle ? createStyleProxy(realStyle) : realStyle;
      } catch {
        return origGetComputedStyle(elt, pseudoElt);
      }
    };
  }
}
