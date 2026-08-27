export const SUPPORTED_LANGUAGES = [
  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'ja', name: '日本語', flag: '🇯🇵' }
];

export const translations = {
  it: {
    nav: {
      home: 'Home',
      habits: 'Abitudini',
      tasks: 'Missioni',
      quests: 'Campagne',
      nutrition: 'Nutrizione',
      finances: 'Finanze',
      settings: 'Impostazioni'
    },
    header: {
      level: 'Livello',
      xp: 'XP',
      streak: 'Serie',
      freezes: 'Protezioni',
      edit_profile: 'Modifica Profilo',
      player_title: 'Scheda Personaggio'
    },
    home: {
      title: 'Dashboard Eroe',
      monthly_challenge: 'Sfida del Mese',
      stats_radar: 'Radar Statistiche',
      recent_activity: 'Attività Recenti',
      pomodoro_timer: 'Pomodoro Timer',
      start_session: 'Avvia Sessione',
      pause: 'Pausa',
      resume: 'Riprendi',
      reset: 'Azzera',
      minutes: 'minuti',
      target_stat: 'Statistica da allenare',
      xp_reward: 'XP Premio'
    },
    habits: {
      title: 'Registro Abitudini',
      add_habit: '+ Nuova Abitudine',
      all: 'Tutti',
      daily: 'Giornaliere',
      weekly: 'Settimanali',
      monthly: 'Mensili',
      streak_days: 'giorni di fila',
      complete: 'Completa',
      completed: 'Completato',
      empty: 'Nessuna abitudine registrata.'
    },
    tasks: {
      title: 'Azioni del Giorno & One-Shot',
      add_task: '+ Nuova Task',
      daily_planner: '📅 Pianificatore Giornaliero',
      due_date: 'Scadenza',
      completed: 'Completate',
      pending: 'Da Fare',
      empty: 'Nessuna task in questa categoria.'
    },
    quests: {
      title: 'Campagne & Sfide',
      add_quest: '+ Nuova Campagna',
      milestones: 'Milestones',
      reward: 'Premio Finale',
      progress: 'Progresso',
      empty: 'Nessuna campagna attiva.'
    },
    nutrition: {
      title: 'Salute & Nutrizione',
      calories: 'Calorie',
      proteins: 'Proteine',
      water: 'Acqua',
      steps: 'Passi',
      weight: 'Peso',
      add_food: '+ Aggiungi Cibo',
      scan_ocr: '📷 Scansiona Tabella (OCR)',
      food_db: 'Alimenti Salvati',
      consumed: 'Consumate',
      goal: 'Obiettivo',
      remaining: 'Rimanenti'
    },
    finances: {
      title: 'Gestione Finanziaria',
      total_balance: 'Saldo Totale',
      cash: 'Contanti',
      add_tx: '+ Transazione',
      income: 'Entrata',
      expense: 'Uscita',
      savings_goals: 'Obiettivi di Risparmio'
    },
    settings: {
      title: 'Impostazioni & Personalizzazione',
      language: 'Lingua dell\'applicazione',
      language_desc: 'Scegli la lingua per tutte le voci dell\'app',
      theme: 'Tema Visivo',
      accent: 'Colore di Accento',
      backup: 'Backup & Ripristino',
      export_json: 'Esporta Dati (JSON)',
      import_json: 'Importa Dati (JSON)',
      general: 'Opzioni Generali',
      penalties: 'Penali per abitudini saltate',
      animated_bg: 'Sfondo Animato',
      past_edits: 'Consenti modifica dati passati',
      planner: 'Abilita Pianificatore Giornaliero',
      recap: 'Abilita Resoconto Settimanale',
      danger_zone: 'Zona Pericolo',
      reset_app: 'Azzera Tutti i Dati'
    },
    common: {
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      confirm: 'Conferma',
      close: 'Chiudi',
      name: 'Nome',
      emoji: 'Emoji',
      difficulty: 'Difficoltà',
      primary_stat: 'Statistica Primaria',
      secondary_stat: 'Statistica Secondaria',
      description: 'Descrizione',
      notes: 'Note'
    }
  },
  en: {
    nav: {
      home: 'Home',
      habits: 'Habits',
      tasks: 'Tasks',
      quests: 'Quests',
      nutrition: 'Nutrition',
      finances: 'Finances',
      settings: 'Settings'
    },
    header: {
      level: 'Level',
      xp: 'XP',
      streak: 'Streak',
      freezes: 'Freezes',
      edit_profile: 'Edit Profile',
      player_title: 'Character Card'
    },
    home: {
      title: 'Hero Dashboard',
      monthly_challenge: 'Monthly Challenge',
      stats_radar: 'Stats Radar',
      recent_activity: 'Recent Activity',
      pomodoro_timer: 'Pomodoro Timer',
      start_session: 'Start Session',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      minutes: 'minutes',
      target_stat: 'Target Stat',
      xp_reward: 'XP Reward'
    },
    habits: {
      title: 'Habits Tracker',
      add_habit: '+ New Habit',
      all: 'All',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      streak_days: 'days streak',
      complete: 'Complete',
      completed: 'Completed',
      empty: 'No habits registered.'
    },
    tasks: {
      title: 'Daily Tasks & One-Shots',
      add_task: '+ New Task',
      daily_planner: '📅 Daily Planner',
      due_date: 'Due Date',
      completed: 'Completed',
      pending: 'To Do',
      empty: 'No tasks in this category.'
    },
    quests: {
      title: 'Quests & Campaigns',
      add_quest: '+ New Quest',
      milestones: 'Milestones',
      reward: 'Final Reward',
      progress: 'Progress',
      empty: 'No active quests.'
    },
    nutrition: {
      title: 'Health & Nutrition',
      calories: 'Calories',
      proteins: 'Proteins',
      water: 'Water',
      steps: 'Steps',
      weight: 'Weight',
      add_food: '+ Add Food',
      scan_ocr: '📷 Scan Label (OCR)',
      food_db: 'Saved Foods',
      consumed: 'Consumed',
      goal: 'Goal',
      remaining: 'Remaining'
    },
    finances: {
      title: 'Financial Management',
      total_balance: 'Total Balance',
      cash: 'Cash',
      add_tx: '+ Transaction',
      income: 'Income',
      expense: 'Expense',
      savings_goals: 'Savings Goals'
    },
    settings: {
      title: 'Settings & Customization',
      language: 'App Language',
      language_desc: 'Select the language for all app labels',
      theme: 'Visual Theme',
      accent: 'Accent Color',
      backup: 'Backup & Restore',
      export_json: 'Export Data (JSON)',
      import_json: 'Import Data (JSON)',
      general: 'General Options',
      penalties: 'Penalties for missed habits',
      animated_bg: 'Animated Background',
      past_edits: 'Allow editing past data',
      planner: 'Enable Daily Planner',
      recap: 'Enable Weekly Recap',
      danger_zone: 'Danger Zone',
      reset_app: 'Reset All Data'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      close: 'Close',
      name: 'Name',
      emoji: 'Emoji',
      difficulty: 'Difficulty',
      primary_stat: 'Primary Stat',
      secondary_stat: 'Secondary Stat',
      description: 'Description',
      notes: 'Notes'
    }
  },
  es: {
    nav: {
      home: 'Inicio',
      habits: 'Hábitos',
      tasks: 'Tareas',
      quests: 'Campañas',
      nutrition: 'Nutrición',
      finances: 'Finanzas',
      settings: 'Ajustes'
    },
    header: {
      level: 'Nivel',
      xp: 'XP',
      streak: 'Racha',
      freezes: 'Escudos',
      edit_profile: 'Editar Perfil',
      player_title: 'Ficha de Personaje'
    },
    home: {
      title: 'Panel del Héroe',
      monthly_challenge: 'Desafío Mensual',
      stats_radar: 'Radar de Estadísticas',
      recent_activity: 'Actividad Reciente',
      pomodoro_timer: 'Temporizador Pomodoro',
      start_session: 'Iniciar Sesión',
      pause: 'Pausa',
      resume: 'Reanudar',
      reset: 'Reiniciar',
      minutes: 'minutos',
      target_stat: 'Estadística a Entrenar',
      xp_reward: 'Recompensa XP'
    },
    habits: {
      title: 'Registro de Hábitos',
      add_habit: '+ Nuevo Hábito',
      all: 'Todos',
      daily: 'Diarios',
      weekly: 'Semanales',
      monthly: 'Mensuales',
      streak_days: 'días seguidos',
      complete: 'Completar',
      completed: 'Completado',
      empty: 'Sin hábitos registrados.'
    },
    tasks: {
      title: 'Tareas Diarias y One-Shots',
      add_task: '+ Nueva Tarea',
      daily_planner: '📅 Planificador Diario',
      due_date: 'Fecha Límite',
      completed: 'Completadas',
      pending: 'Por Hacer',
      empty: 'No hay tareas en esta categoría.'
    },
    quests: {
      title: 'Campañas y Desafíos',
      add_quest: '+ Nueva Campaña',
      milestones: 'Subobjetivos',
      reward: 'Premio Final',
      progress: 'Progreso',
      empty: 'No hay campañas activas.'
    },
    nutrition: {
      title: 'Salud y Nutrición',
      calories: 'Calorías',
      proteins: 'Proteínas',
      water: 'Agua',
      steps: 'Pasos',
      weight: 'Peso',
      add_food: '+ Añadir Comida',
      scan_ocr: '📷 Escanear Tabla (OCR)',
      food_db: 'Alimentos Guardados',
      consumed: 'Consumidas',
      goal: 'Meta',
      remaining: 'Restantes'
    },
    finances: {
      title: 'Gestión Financiera',
      total_balance: 'Saldo Total',
      cash: 'Efectivo',
      add_tx: '+ Transacción',
      income: 'Ingreso',
      expense: 'Gasto',
      savings_goals: 'Metas de Ahorro'
    },
    settings: {
      title: 'Ajustes y Personalización',
      language: 'Idioma de la Aplicación',
      language_desc: 'Selecciona el idioma para todas las etiquetas',
      theme: 'Tema Visual',
      accent: 'Color de Acento',
      backup: 'Copia de Seguridad',
      export_json: 'Exportar Datos (JSON)',
      import_json: 'Importar Datos (JSON)',
      general: 'Opciones Generales',
      penalties: 'Penalizaciones por hábitos omitidos',
      animated_bg: 'Fondo Animado',
      past_edits: 'Permitir editar datos pasados',
      planner: 'Activar Planificador Diario',
      recap: 'Activar Resumen Semanal',
      danger_zone: 'Zona de Peligro',
      reset_app: 'Restablecer Todos los Datos'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      name: 'Nombre',
      emoji: 'Emoji',
      difficulty: 'Dificultad',
      primary_stat: 'Estadística Primaria',
      secondary_stat: 'Estadística Secundaria',
      description: 'Descripción',
      notes: 'Notas'
    }
  },
  ja: {
    nav: {
      home: 'ホーム',
      habits: '習慣',
      tasks: 'タスク',
      quests: 'クエスト',
      nutrition: '栄養',
      finances: '家計',
      settings: '設定'
    },
    header: {
      level: 'レベル',
      xp: 'XP',
      streak: '連続',
      freezes: 'フリーズ',
      edit_profile: 'プロフィール編集',
      player_title: 'キャラクターカード'
    },
    home: {
      title: 'ヒーローダッシュボード',
      monthly_challenge: '今月のチャレンジ',
      stats_radar: 'ステータスレーダー',
      recent_activity: '最近のアクティビティ',
      pomodoro_timer: 'ポモドーロタイマー',
      start_session: 'セッション開始',
      pause: '一時停止',
      resume: '再開',
      reset: 'リセット',
      minutes: '分',
      target_stat: 'トレーニング対象',
      xp_reward: '報酬XP'
    },
    habits: {
      title: '習慣トラッカー',
      add_habit: '+ 新しい習慣',
      all: 'すべて',
      daily: '毎日',
      weekly: '毎週',
      monthly: '毎月',
      streak_days: '日連続',
      complete: '完了する',
      completed: '完了済み',
      empty: '登録された習慣はありません。'
    },
    tasks: {
      title: '今日のタスクとワンショット',
      add_task: '+ 新しいタスク',
      daily_planner: '📅 デイリープランナー',
      due_date: '期限',
      completed: '完了済み',
      pending: '未完了',
      empty: 'このカテゴリーのタスクはありません。'
    },
    quests: {
      title: 'クエスト＆キャンペーン',
      add_quest: '+ 新しいクエスト',
      milestones: 'マイルストーン',
      reward: '最終報酬',
      progress: '進捗',
      empty: 'アクティブなクエストはありません。'
    },
    nutrition: {
      title: '健康と栄養',
      calories: 'カロリー',
      proteins: 'タンパク質',
      water: '水分',
      steps: '歩数',
      weight: '体重',
      add_food: '+ 食品を追加',
      scan_ocr: '📷 ラベルスキャン (OCR)',
      food_db: '保存された食品',
      consumed: '摂取量',
      goal: '目標',
      remaining: '残り'
    },
    finances: {
      title: '財務管理',
      total_balance: '総残高',
      cash: '現金',
      add_tx: '+ 取引を追加',
      income: '収入',
      expense: '支出',
      savings_goals: '貯金目標'
    },
    settings: {
      title: '設定とカスタマイズ',
      language: 'アプリの言語',
      language_desc: 'アプリ全体の表示言語を選択します',
      theme: '表示テーマ',
      accent: 'アクセントカラー',
      backup: 'バックアップと復元',
      export_json: 'データエクスポート (JSON)',
      import_json: 'データインポート (JSON)',
      general: '一般設定',
      penalties: '未達成習慣のペナルティ',
      animated_bg: 'アニメーション背景',
      past_edits: '過去データの編集を許可',
      planner: 'デイリープランナーを有効化',
      recap: 'ウィークリーレポートを有効化',
      danger_zone: '危険ゾーン',
      reset_app: '全データをリセット'
    },
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      confirm: '確認',
      close: '閉じる',
      name: '名前',
      emoji: '絵文字',
      difficulty: '難易度',
      primary_stat: '主ステータス',
      secondary_stat: '副ステータス',
      description: '説明',
      notes: 'メモ'
    }
  }
};

/**
 * Gets a translated string by dot notation key (e.g. 'nav.home')
 * @param {string} key 
 * @param {string} lang 'it' | 'en' | 'es' | 'ja'
 * @returns {string}
 */
export function t(key, lang = 'it') {
  const selectedLang = ['it', 'en', 'es', 'ja'].includes(lang) ? lang : 'it';
  const keys = key.split('.');

  let obj = translations[selectedLang];
  for (const k of keys) {
    if (obj && obj[k] !== undefined) {
      obj = obj[k];
    } else {
      // Fallback to Italian if key is missing in selected language
      let fallback = translations['it'];
      for (const fk of keys) {
        if (fallback && fallback[fk] !== undefined) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      return fallback;
    }
  }
  return obj;
}
