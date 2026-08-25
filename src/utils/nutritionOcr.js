import { createWorker } from 'tesseract.js';

/**
 * Parses raw text extracted from a nutrition label to extract calories (kcal) and proteins (g).
 * @param {string} text 
 * @returns {{ calories: number|null, proteins: number|null, rawText: string }}
 */
export function parseNutritionText(text) {
  if (!text) return { calories: null, proteins: null, rawText: '' };

  const rawText = text;

  // Clean text and normalize decimal commas (e.g. 4,5 -> 4.5)
  const cleanText = text.replace(/(\d+)\s*,\s*(\d+)/g, '$1.$2');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  let foundCalories = null;
  let foundProteins = null;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 1. Calories (kcal) on the same line
    if (foundCalories === null && (lower.includes('kcal') || lower.includes('energia') || lower.includes('energy'))) {
      const kcalMatch = line.match(/(\d+(?:\.\d+)?)\s*kcal/i) || line.match(/kcal\s*(\d+(?:\.\d+)?)/i);
      if (kcalMatch) {
        const val = parseFloat(kcalMatch[1]);
        if (val >= 5 && val <= 950 && val !== 100) {
          foundCalories = Math.round(val);
        }
      } else {
        const numbers = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
        const plausible = numbers.filter(n => n >= 5 && n <= 950 && n !== 100);
        if (plausible.length > 0) {
          foundCalories = Math.round(Math.min(...plausible));
        }
      }
    }

    // 2. Proteins on the same line (looking for "proteine", "protein", "prot")
    if (foundProteins === null && /(?:proteine|protein|proteina|prot)/i.test(lower)) {
      const numbers = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
      const valid = numbers.filter(n => n !== 100 && n <= 100);
      if (valid.length > 0) {
        foundProteins = Math.round(valid[0] * 10) / 10;
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
