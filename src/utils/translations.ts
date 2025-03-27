// Translation dictionary for multiple languages
export const translations = {
  en: {
    // Navigation
    create: "Create",
    notes: "Notes",
    history: "History",
    settings: "Settings",
    dashboard: "Dashboard",
    
    // Common actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    
    // Create page
    enterYoutubeUrl: "Enter YouTube URL",
    summarize: "Summarize",
    videoSummary: "Video Summary",
    saveNote: "Save Note",
    
    // Notes page
    myNotes: "My Notes",
    noNotes: "No notes found",
    searchNotes: "Search notes",
    
    // History page
    recentVideos: "Recent Videos",
    noHistory: "No video history",
    
    // Settings page
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    
    // Languages
    languageEnglish: "English",
    languageSpanish: "Spanish",
    languageFrench: "French",
    languageGerman: "German",
    languageChinese: "Chinese",
  },
  
  es: {
    // Navigation
    create: "Crear",
    notes: "Notas",
    history: "Historial",
    settings: "Ajustes",
    dashboard: "Panel",
    
    // Common actions
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    
    // Create page
    enterYoutubeUrl: "Ingrese URL de YouTube",
    summarize: "Resumir",
    videoSummary: "Resumen del video",
    saveNote: "Guardar nota",
    
    // Notes page
    myNotes: "Mis notas",
    noNotes: "No se encontraron notas",
    searchNotes: "Buscar notas",
    
    // History page
    recentVideos: "Videos recientes",
    noHistory: "Sin historial de videos",
    
    // Settings page
    language: "Idioma",
    theme: "Tema",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    
    // Languages
    languageEnglish: "Inglés",
    languageSpanish: "Español",
    languageFrench: "Francés",
    languageGerman: "Alemán",
    languageChinese: "Chino",
  },
  
  fr: {
    // Navigation
    create: "Créer",
    notes: "Notes",
    history: "Historique",
    settings: "Paramètres",
    dashboard: "Tableau de bord",
    
    // Common actions
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    
    // Create page
    enterYoutubeUrl: "Entrez l'URL YouTube",
    summarize: "Résumer",
    videoSummary: "Résumé de la vidéo",
    saveNote: "Enregistrer la note",
    
    // Notes page
    myNotes: "Mes notes",
    noNotes: "Aucune note trouvée",
    searchNotes: "Rechercher des notes",
    
    // History page
    recentVideos: "Vidéos récentes",
    noHistory: "Aucun historique vidéo",
    
    // Settings page
    language: "Langue",
    theme: "Thème",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    
    // Languages
    languageEnglish: "Anglais",
    languageSpanish: "Espagnol",
    languageFrench: "Français",
    languageGerman: "Allemand",
    languageChinese: "Chinois",
  },
  
  de: {
    // Navigation
    create: "Erstellen",
    notes: "Notizen",
    history: "Verlauf",
    settings: "Einstellungen",
    dashboard: "Dashboard",
    
    // Common actions
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    
    // Create page
    enterYoutubeUrl: "YouTube-URL eingeben",
    summarize: "Zusammenfassen",
    videoSummary: "Videozusammenfassung",
    saveNote: "Notiz speichern",
    
    // Notes page
    myNotes: "Meine Notizen",
    noNotes: "Keine Notizen gefunden",
    searchNotes: "Notizen durchsuchen",
    
    // History page
    recentVideos: "Kürzlich angesehene Videos",
    noHistory: "Kein Videoverlauf",
    
    // Settings page
    language: "Sprache",
    theme: "Thema",
    darkMode: "Dunkelmodus",
    lightMode: "Hellmodus",
    
    // Languages
    languageEnglish: "Englisch",
    languageSpanish: "Spanisch",
    languageFrench: "Französisch",
    languageGerman: "Deutsch",
    languageChinese: "Chinesisch",
  },
  
  zh: {
    // Navigation
    create: "创建",
    notes: "笔记",
    history: "历史",
    settings: "设置",
    dashboard: "仪表板",
    
    // Common actions
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    
    // Create page
    enterYoutubeUrl: "输入YouTube网址",
    summarize: "摘要",
    videoSummary: "视频摘要",
    saveNote: "保存笔记",
    
    // Notes page
    myNotes: "我的笔记",
    noNotes: "未找到笔记",
    searchNotes: "搜索笔记",
    
    // History page
    recentVideos: "最近的视频",
    noHistory: "没有视频历史",
    
    // Settings page
    language: "语言",
    theme: "主题",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    
    // Languages
    languageEnglish: "英语",
    languageSpanish: "西班牙语",
    languageFrench: "法语",
    languageGerman: "德语",
    languageChinese: "中文",
  },
};

// Type for translation keys
export type TranslationKey = keyof typeof translations.en; 