import { createWorker } from 'tesseract.js';

/**
 * Parses raw text extracted from a nutrition label to extract calories (kcal) and proteins (g).
 * @param {string} text 
 * @returns {{ calories: number|null, proteins: number|null, rawText: string }}
 */
export function parseNutritionText(text) {
  if (!text) return { calories: null, proteins: null, rawText: '' };

  const rawText = text;

  // Preprocessing: Replace OCR typos in numbers & commas
  let clean = text
    .replace(/(\d+)\s*,\s*(\d+)/g, '$1.$2')
    .replace(/(\d+)\s*[oO]\s*(\d+)?/g, (m, p1, p2) => p1 + '0' + (p2 || ''))
    .replace(/kca[l1|i]/gi, 'kcal');

  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

  let foundCalories = null;
  let foundProteins = null;

  // 1. Kcal Extraction: match number right before or after 'kcal'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kcalMatch = line.match(/(\d+(?:\.\d+)?)\s*kcal/i) || line.match(/kcal\s*(\d+(?:\.\d+)?)/i);
    if (kcalMatch) {
      const val = parseFloat(kcalMatch[1]);
      if (val >= 5 && val <= 950 && val !== 100) {
        foundCalories = Math.round(val);
        break;
      }
    }
  }

  // Fallback for calories if 'kcal' label wasn't found directly next to a number
  if (foundCalories === null) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/energia|energy|valore energetico/i.test(line)) {
        const matches = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
        const plausible = matches.filter(n => n >= 10 && n <= 950 && n !== 100);
        if (plausible.length > 0) {
          // If multiple numbers on line (e.g. 630 kJ / 150 kcal), calories is the smaller value!
          foundCalories = Math.round(Math.min(...plausible));
          break;
        }
      }
    }
  }

  // 2. Protein Extraction (fuzzy matching + multi-line lookahead)
  const proteinRegex = /(?:p[r0oó][otl1i!\-]{1,3}[eé3o0]?[i1l]?n|prot|proie|protel|prole|proteina|protein|prtein|protn)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (proteinRegex.test(line)) {
      // Find numbers on current line
      let matches = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
      let valid = matches.filter(n => n !== 100 && n <= 100);

      // Multi-line lookahead if no valid number on current line (e.g. label and number on separate lines)
      if (valid.length === 0) {
        for (let j = 1; j <= 2 && i + j < lines.length; j++) {
          const nextLine = lines[i + j];
          const nextMatches = [...nextLine.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
          const nextValid = nextMatches.filter(n => n !== 100 && n <= 100);
          if (nextValid.length > 0) {
            valid = nextValid;
            break;
          }
        }
      }

      if (valid.length > 0) {
        foundProteins = Math.round(valid[0] * 10) / 10;
        break;
      }
    }
  }

  return {
    calories: foundCalories,
    proteins: foundProteins,
    rawText
  };
}

/**
 * Processes an image using Tesseract worker and extracts nutrition data.
 * @param {File|Blob|string} imageSource 
 * @param {function(number, string): void} onProgress Callback for progress update
 * @returns {Promise<{ calories: number|null, proteins: number|null, rawText: string }>}
 */
export async function processNutritionImage(imageSource, onProgress) {
  let worker = null;
  try {
    worker = await createWorker('ita+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round((m.progress || 0) * 100);
          onProgress(pct, `Analisi testo in corso... (${pct}%)`);
        } else if (onProgress) {
          onProgress(0, 'Inizializzazione OCR...');
        }
      }
    });

    const ret = await worker.recognize(imageSource);
    await worker.terminate();
    worker = null;

    return parseNutritionText(ret.data.text);
  } catch (err) {
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }
    throw err;
  }
}
