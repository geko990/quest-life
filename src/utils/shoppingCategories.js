// Ordina la lista della spesa per reparto, con un dizionario di parole chiave.
// Funziona offline e all'istante; le correzioni manuali dell'utente vincono sempre
// (vengono salvate in settings.shoppingCategoryOverrides: { "nome normalizzato": "idReparto" }).

// L'ordine dell'elenco è quello in cui compaiono i reparti nella lista (percorso tipico di un supermercato).
export const SHOPPING_CATEGORIES = {
  food: [
    { id: 'frutta_verdura', label: 'Frutta e verdura', emoji: '🥬' },
    { id: 'pane_forno', label: 'Pane e forno', emoji: '🥖' },
    { id: 'carne_pesce', label: 'Carne e pesce', emoji: '🥩' },
    { id: 'salumi_formaggi', label: 'Salumi e formaggi', emoji: '🧀' },
    { id: 'latticini_uova', label: 'Latte, yogurt e uova', emoji: '🥛' },
    { id: 'pasta_riso', label: 'Pasta, riso e cereali', emoji: '🍝' },
    { id: 'dispensa', label: 'Dispensa e condimenti', emoji: '🫙' },
    { id: 'colazione_dolci', label: 'Colazione e dolci', emoji: '🍪' },
    { id: 'surgelati', label: 'Surgelati', emoji: '🧊' },
    { id: 'bevande', label: 'Bevande', emoji: '🥤' },
    { id: 'integratori', label: 'Integratori e sport', emoji: '💪' },
    { id: 'altro', label: 'Altro', emoji: '🛒' }
  ],
  home: [
    { id: 'pulizia_casa', label: 'Pulizia casa', emoji: '🧽' },
    { id: 'bucato', label: 'Bucato', emoji: '🧺' },
    { id: 'igiene_persona', label: 'Igiene personale', emoji: '🧴' },
    { id: 'carta_monouso', label: 'Carta e monouso', emoji: '🧻' },
    { id: 'farmacia', label: 'Farmacia', emoji: '💊' },
    { id: 'animali', label: 'Animali', emoji: '🐾' },
    { id: 'casa_varie', label: 'Casa e ferramenta', emoji: '🔧' },
    { id: 'altro', label: 'Altro', emoji: '🛒' }
  ]
};

// Parole chiave (radici, senza accenti). Si confrontano con l'inizio delle parole del prodotto.
const KEYWORDS = {
  frutta_verdura: ['mel', 'pera', 'pere', 'banan', 'aranc', 'mandarin', 'clementin', 'limon', 'lime', 'kiwi', 'fragol', 'uva', 'pesc', 'albicocc', 'cilieg', 'prugn', 'susin', 'anguri', 'melon', 'ananas', 'mango', 'avocad', 'frutti di bosco', 'mirtill', 'lampon', 'pomodor', 'pomodorin', 'insalat', 'lattug', 'rucol', 'spinac', 'zucchin', 'melanzan', 'peperon', 'carot', 'cipoll', 'agli', 'patat', 'zucca', 'broccol', 'cavol', 'cavolfior', 'verz', 'finocch', 'sedan', 'cetriol', 'fungh', 'champignon', 'asparag', 'carciof', 'porr', 'radicchi', 'basilic', 'prezzemol', 'rosmarin', 'salvi', 'menta', 'zenzer', 'frutta', 'verdur', 'ortagg', 'cime di rapa', 'bietol', 'fagiolin', 'piselli fresch', 'cocco', 'datter', 'fichi', 'melagran', 'mais dolce'],
  pane_forno: ['pane', 'panin', 'pancarre', 'piadin', 'focacc', 'grissin', 'cracker', 'fette biscottat', 'tarall', 'pizza', 'impasto', 'pasta sfoglia', 'pasta brise', 'tortill', 'wrap', 'friselle', 'crostin', 'pangrattat'],
  carne_pesce: ['pollo', 'petto di pollo', 'tacchin', 'manzo', 'vitell', 'maial', 'macinat', 'hamburger', 'burger', 'bistecc', 'filetto', 'salsicc', 'wurstel', 'agnell', 'conigli', 'arrost', 'cotolett', 'polpett', 'carne', 'pesce', 'salmon', 'tonno fresco', 'merluzz', 'orata', 'branzin', 'spigol', 'gamber', 'cozz', 'vongol', 'calamar', 'polp', 'seppi', 'sgombr', 'trota', 'baccala', 'sogliol', 'platess', 'alici', 'acciugh fresch', 'sushi', 'fesa'],
  salumi_formaggi: ['prosciutt', 'cotto', 'crudo', 'salame', 'mortadell', 'bresaol', 'speck', 'pancett', 'guancial', 'coppa', 'affettat', 'formagg', 'parmigian', 'grana', 'pecorin', 'mozzarell', 'burrat', 'stracchin', 'ricott', 'mascarpon', 'gorgonzol', 'scamorz', 'provolon', 'fontin', 'asiago', 'emmental', 'feta', 'philadelphia', 'spalmabil', 'sottilett', 'fiocchi di latte', 'stracciatell', 'taleggi', 'brie', 'cheddar', 'edamer'],
  latticini_uova: ['latte', 'yogurt', 'yoghurt', 'skyr', 'kefir', 'burro', 'panna', 'uova', 'uovo', 'albume', 'besciamell', 'budino', 'margarin'],
  pasta_riso: ['pasta', 'spaghett', 'penne', 'fusill', 'rigaton', 'farfall', 'linguin', 'tagliatell', 'lasagn', 'gnocch', 'ravioli', 'tortellin', 'riso', 'basmati', 'risott', 'farro', 'orzo', 'quinoa', 'couscous', 'cous cous', 'avena', 'fiocchi d avena', 'polenta', 'cereali', 'muesli', 'granola', 'semol', 'noodle', 'bulgur'],
  dispensa: ['olio', 'aceto', 'sale', 'pepe', 'zucchero', 'farina', 'lievito', 'passata', 'pelati', 'polpa di pomodoro', 'concentrato', 'sugo', 'pesto', 'tonno', 'sgombro in scatola', 'legum', 'ceci', 'fagioli', 'lenticch', 'piselli', 'mais', 'olive', 'capperi', 'sottacet', 'sottoli', 'brodo', 'dado', 'spezie', 'origano', 'paprika', 'curry', 'cannella', 'maionese', 'ketchup', 'senape', 'salsa', 'soia', 'miele', 'marmellat', 'confettur', 'nutella', 'crema spalmabil', 'burro di arachidi', 'frutta secca', 'mandorl', 'noci', 'nocciol', 'arachid', 'pistacch', 'anacard', 'semi', 'cioccolato fondente da cucina', 'acciughe', 'pinoli', 'uvetta', 'cacao', 'aceto balsamico'],
  colazione_dolci: ['biscott', 'merend', 'brioche', 'cornett', 'croissant', 'plumcake', 'torta', 'crostat', 'cioccolat', 'caramell', 'gelatin', 'caffe', 'cialde', 'capsule', 'te', 'the', 'tisan', 'camomill', 'infuso', 'orzo solubil', 'snack', 'patatin', 'popcorn', 'wafer', 'pandoro', 'panettone', 'colomba', 'dolci'],
  surgelati: ['surgelat', 'congelat', 'frozen', 'bastoncin', 'sofficin', 'minestrone surgel', 'spinaci surgel', 'piselli surgel', 'ghiaccio', 'gelat'],
  bevande: ['acqua', 'frizzant', 'natural', 'succo', 'spremut', 'aranciat', 'coca', 'cola', 'pepsi', 'sprite', 'chinotto', 'gassos', 'tonica', 'birra', 'vino', 'prosecco', 'spumant', 'aperol', 'campari', 'gin', 'vodka', 'rum', 'whisky', 'amaro', 'liquor', 'energy drink', 'red bull', 'bevanda', 'latte di soia', 'latte di mandorl', 'latte di avena', 'kombucha', 'sciropp'],
  integratori: ['protein', 'whey', 'creatin', 'integrator', 'barrett', 'bcaa', 'vitamin', 'omega', 'magnesio', 'potassio', 'collagene', 'elettroliti', 'gainer', 'isolat'],
  pulizia_casa: ['detersivo piatti', 'piatti', 'lavastovigl', 'pastiglie', 'sgrassator', 'anticalcare', 'candeggin', 'varechin', 'amuchina', 'disinfettant', 'spugn', 'panno', 'panni', 'stracc', 'mocio', 'scopa', 'paletta', 'secchio', 'guanti', 'detergente', 'pavimenti', 'vetri', 'bagno', 'wc', 'deodorante per ambient', 'profumator', 'insetticid', 'sacchi', 'sacchetti spazzatura', 'spazzatura', 'pattumier', 'brillantant', 'sale lavastovigl'],
  bucato: ['detersivo', 'lavatric', 'ammorbident', 'smacchiat', 'bucato', 'candeggina delicat', 'perle profum', 'mollett', 'stendin', 'appendin'],
  igiene_persona: ['sapone', 'bagnoschiuma', 'docciaschiuma', 'shampoo', 'balsamo', 'dentifric', 'spazzolin', 'filo interdental', 'collutori', 'deodorant', 'rasoi', 'lamette', 'schiuma da barba', 'dopobarba', 'crema', 'lozione', 'assorbent', 'salvaslip', 'cotton', 'dischetti', 'struccant', 'trucco', 'mascara', 'profumo', 'gel', 'lacca', 'pettine', 'spazzola', 'tampon', 'pannolin', 'salviettine'],
  carta_monouso: ['carta igienic', 'carta da cucina', 'scottex', 'rotoloni', 'fazzolett', 'tovagliol', 'piatti di carta', 'bicchieri', 'posate di plastic', 'pellicol', 'alluminio', 'carta forno', 'sacchetti gelo', 'sacchetti freezer', 'stuzzicadent', 'cannucc'],
  farmacia: ['tachipirin', 'paracetamol', 'ibuprofen', 'moment', 'oki', 'aspirin', 'cerott', 'garze', 'disinfettante ferit', 'acqua ossigenat', 'termometr', 'collirio', 'sciroppo per la tosse', 'medicin', 'farmac', 'pomata', 'antistaminic', 'mascherin'],
  animali: ['crocchett', 'scatolett', 'lettiera', 'sabbia gatt', 'cibo cane', 'cibo gatto', 'cane', 'gatto', 'gatti', 'cani', 'antiparassitar', 'guinzaglio'],
  casa_varie: ['lampadin', 'pile', 'batterie', 'nastro', 'scotch', 'colla', 'viti', 'chiodi', 'candel', 'fiammifer', 'accendin', 'prolung', 'cavo', 'caricator', 'filtro', 'filtri', 'sacchetti aspirapolv', 'zanzarier', 'piante', 'terriccio']
};

const normalize = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeShoppingName = normalize;

// Restituisce l'id del reparto per un prodotto della lista 'food' o 'home'.
export function categorizeShoppingItem(name, tab = 'food', overrides = {}) {
  const norm = normalize(name);
  if (!norm) return 'altro';
  if (overrides && overrides[`${tab}:${norm}`]) return overrides[`${tab}:${norm}`];

  const validIds = new Set((SHOPPING_CATEGORIES[tab] || SHOPPING_CATEGORIES.food).map(c => c.id));
  const padded = ` ${norm} `;
  let best = null;
  let bestLen = 0;
  let bestPos = Infinity;
  // Le parole chiave più lunghe (più specifiche) vincono: "latte di mandorla" → Bevande, non Latticini.
  // A parità, vince quella più vicina all'inizio: "passata di pomodoro" → Dispensa.
  // Le parole molto corte (es. "te", 2 lettere) devono coincidere con una parola intera.
  for (const [catId, words] of Object.entries(KEYWORDS)) {
    if (!validIds.has(catId)) continue;
    for (const w of words) {
      const key = normalize(w);
      if (!key) continue;
      const pos = padded.indexOf(key.length <= 2 ? ` ${key} ` : ` ${key}`);
      if (pos === -1) continue;
      if (key.length > bestLen || (key.length === bestLen && pos < bestPos)) {
        best = catId;
        bestLen = key.length;
        bestPos = pos;
      }
    }
  }
  return best || 'altro';
}

export function getShoppingCategory(tab, catId) {
  const list = SHOPPING_CATEGORIES[tab] || SHOPPING_CATEGORIES.food;
  return list.find(c => c.id === catId) || list[list.length - 1];
}

// Raggruppa gli elementi per reparto, nell'ordine del percorso del supermercato.
export function groupShoppingItems(items = [], tab = 'food', overrides = {}) {
  const list = SHOPPING_CATEGORIES[tab] || SHOPPING_CATEGORIES.food;
  const groups = list.map(cat => ({ ...cat, items: [] }));
  const byId = Object.fromEntries(groups.map(g => [g.id, g]));
  for (const item of items) {
    const catId = categorizeShoppingItem(item.name, tab, overrides);
    (byId[catId] || byId.altro).items.push(item);
  }
  return groups.filter(g => g.items.length > 0);
}
