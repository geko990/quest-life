import { createWorker } from 'tesseract.js';

/**
 * Parses raw text extracted from a nutrition label to extract calories (kcal) and proteins (g).
 * @param {string} text 
 * @returns {{ calories: number|null, proteins: number|null, rawText: string }}
 */
export function parseNutritionText(text) {
  if (!text) return { calories: null, proteins: null, rawText: '' };

  const rawText = text;
  // Normalize text for easier parsing
  let clean = text.toLowerCase()
    .replace(/kca[l1|i]/g, 'kcal')
    .replace(/kj/g, 'kj')
    .replace(/prot[eé]in[ae]/g, 'proteine')
    .replace(/valor[ei]\s*energetic[oi]/g, 'energia')
    .replace(/[\:\=]/g, ' ')
    .replace(/(\d+)\s*,\s*(\d+)/g, '$1.$2'); // replace comma with dot in numbers

  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

  let foundCalories = null;
  let foundProteins = null;

  // 1. SEARCH FOR CALORIES (kcal)
  for (const line of lines) {
    if (line.includes('kcal')) {
      const matches = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
      // Find a plausible calorie value (e.g. between 5 and 950)
      const plausible = matches.find(n => n >= 5 && n <= 950 && n !== 100);
      if (plausible !== undefined) {
        foundCalories = Math.round(plausible);
        break;
      }
    }
  }

  // Fallback for calories if 'kcal' keyword was missed but 'energia' or 'energy' is present
  if (foundCalories === null) {
    for (const line of lines) {
      if (line.includes('energia') || line.includes('energy')) {
        const matches = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
        const plausible = matches.find(n => n >= 10 && n <= 950 && n !== 100);
        if (plausible !== undefined) {
          foundCalories = Math.round(plausible);
          break;
        }
      }
    }
  }

  // 2. SEARCH FOR PROTEINS (proteine / protein)
  for (const line of lines) {
    if (line.includes('proteine') || line.includes('protein')) {
      const matches = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
      const validNumbers = matches.filter(n => n !== 100 && n <= 100);
      if (validNumbers.length > 0) {
        foundProteins = Math.round(validNumbers[0] * 10) / 10;
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
