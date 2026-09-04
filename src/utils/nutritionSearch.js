/**
 * Nutrition search utility using Open Food Facts public CORS-enabled search endpoint.
 * Supports Italian & international food searches with calories and macronutrients per 100g.
 */

// Helper to infer emoji from food name keywords
export function guessFoodEmoji(name = '') {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return '🍕';
  if (n.includes('pasta') || n.includes('spaghett') || n.includes('tagliatell') || n.includes('penne') || n.includes('fusill') || n.includes('maccheron') || n.includes('lasagn') || n.includes('gnocch') || n.includes('tortellin') || n.includes('ravioli')) return '🍝';
  if (n.includes('riso') || n.includes('risotto')) return '🍚';
  if (n.includes('pollo') || n.includes('tacchino') || n.includes('galletto')) return '🍗';
  if (n.includes('bistecca') || n.includes('carne') || n.includes('manzo') || n.includes('vitello') || n.includes('maiale') || n.includes('hamburger') || n.includes('polpett')) return '🥩';
  if (n.includes('pesce') || n.includes('tonno') || n.includes('salmone') || n.includes('merluzzo') || n.includes('orata') || n.includes('spigola') || n.includes('sardine')) return '🐟';
  if (n.includes('gamber') || n.includes('crostace')) return '🦐';
  if (n.includes('uov') || n.includes('uovo') || n.includes('frittata') || n.includes('omelette')) return '🥚';
  if (n.includes('insalat') || n.includes('verdura') || n.includes('spinac') || n.includes('zucch') || n.includes('pomodor') || n.includes('carot') || n.includes('broccoli') || n.includes('lattuga')) return '🥗';
  if (n.includes('pane') || n.includes('fetta') || n.includes('panino') || n.includes('toast') || n.includes('focaccia') || n.includes('piadina') || n.includes('bruschett')) return '🍞';
  if (n.includes('formagg') || n.includes('mozzarella') || n.includes('parmigiano') || n.includes('grana') || n.includes('ricotta') || n.includes('caciotta')) return '🧀';
  if (n.includes('yogurt') || n.includes('porridge') || n.includes('cereali') || n.includes('muesli') || n.includes('avena')) return '🥣';
  if (n.includes('latte')) return '🥛';
  if (n.includes('caffè') || n.includes('cappuccino') || n.includes('espresso')) return '☕';
  if (n.includes('mela')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('aranci') || n.includes('mandarin') || n.includes('agrumi')) return '🍊';
  if (n.includes('frutta') || n.includes('fragol') || n.includes('frutti')) return '🍓';
  if (n.includes('dolce') || n.includes('torta') || n.includes('crostata') || n.includes('cheesecake') || n.includes('tiramisù') || n.includes('muffin')) return '🍰';
  if (n.includes('biscott') || n.includes('cookie')) return '🍪';
  if (n.includes('cioccolat')) return '🍫';
  if (n.includes('cornetto') || n.includes('brioche') || n.includes('croissant')) return '🥐';
  if (n.includes('patat')) return '🥔';
  if (n.includes('gelato')) return '🍨';
  if (n.includes('olio') || n.includes('oliva')) return '🫒';
  if (n.includes('birra')) return '🍺';
  if (n.includes('vino')) return '🍷';
  if (n.includes('panzerott') || n.includes('rustico')) return '🥟';
  if (n.includes('zuppa') || n.includes('minestr') || n.includes('brodo')) return '🍲';
  return '🍽️';
}

/**
 * Searches Open Food Facts for foods matching the query string.
 * @param {string} query Search terms (e.g. "pasta carbonara", "petto di pollo", "mela")
 * @param {number} pageSize Number of results to fetch (default 8)
 * @returns {Promise<Array>} Array of parsed food items
 */
export async function searchOnlineFood(query, pageSize = 8) {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  // Try Italian mirror first, then fallback to world mirror
  const endpoints = [
    `https://it.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(cleanQ)}&search_simple=1&action=process&json=1&page_size=${pageSize}`,
    `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(cleanQ)}&search_simple=1&action=process&json=1&page_size=${pageSize}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      const products = data.products || [];

      if (!Array.isArray(products) || products.length === 0) continue;

      const validItems = [];

      for (const p of products) {
        const name = (p.product_name_it || p.product_name || p.generic_name_it || p.generic_name || '').trim();
        if (!name) continue;

        const nutriments = p.nutriments || {};

        // Extract calories per 100g (or calculate from energy in kJ if needed)
        let kcal100g = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'];
        if (kcal100g === undefined || kcal100g === null) {
          const energyKj = nutriments['energy_100g'] ?? nutriments['energy'];
          if (energyKj && !isNaN(energyKj)) {
            kcal100g = Math.round(Number(energyKj) / 4.184);
          }
        } else {
          kcal100g = Math.round(Number(kcal100g));
        }

        // Extract proteins per 100g
        const proteins100g = nutriments['proteins_100g'] ?? nutriments['proteins'];
        const protVal = (proteins100g !== undefined && proteins100g !== null && !isNaN(proteins100g))
          ? Math.round(Number(proteins100g) * 10) / 10
          : 0;

        // Extract carbs & fat if present
        const carbs100g = nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'];
        const carbVal = (carbs100g !== undefined && carbs100g !== null && !isNaN(carbs100g))
          ? Math.round(Number(carbs100g) * 10) / 10
          : null;

        const fat100g = nutriments['fat_100g'] ?? nutriments['fat'];
        const fatVal = (fat100g !== undefined && fat100g !== null && !isNaN(fat100g))
          ? Math.round(Number(fat100g) * 10) / 10
          : null;

        // Skip items that have no calories at all or clearly invalid
        if (kcal100g === undefined || kcal100g === null || isNaN(kcal100g)) {
          // If product has no 100g calories, skip or set 0
          continue;
        }

        const brand = (p.brands || '').split(',')[0].trim();
        const servingSize = (p.serving_size || '').trim();
        const emoji = guessFoodEmoji(name);

        validItems.push({
          id: 'off_' + (p._id || p.code || Math.random().toString(36).substring(2, 8)),
          name,
          brand: brand || null,
          emoji,
          baseGrams: 100,
          baseCalories: kcal100g,
          baseProteins: protVal,
          carbs: carbVal,
          fat: fatVal,
          servingSize: servingSize || null,
          imageUrl: p.image_front_small_url || p.image_url || null
        });

        if (validItems.length >= pageSize) break;
      }

      if (validItems.length > 0) {
        return validItems;
      }
    } catch (err) {
      console.warn('Nutrition search error on:', url, err);
    }
  }

  return [];
}
