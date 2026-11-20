"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "tr" | "fr" | "es" | "de" | "it";

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
];

export const TRANSLATIONS = {
  en: {
    // Brand & Global
    proStudio: "PRO STUDIO",
    allTools: "All tools",
    pricing: "Pricing",
    feedback: "Feedback",
    signIn: "Sign In / Log In",
    logOut: "Log Out",
    upgradePro: "Upgrade to PRO",
    monthly: "Monthly",
    creditPack: "Credit Pack",
    resets: "Resets",
    midiAndNotation: "MIDI & NOTATION",

    // Navigation Tools
    virtualPiano: "Virtual Piano",
    midiToSheet: "MIDI to Sheet Music",
    aiMidi: "AI MIDI Generator",
    mp3ToMidi: "MP3 to MIDI",
    sheetToMidi: "Sheet Music to MIDI",
    midiEditor: "MIDI Editor",
    scanner: "Sheet Music Scanner",

    // Tool Badges & Descs
    proFeature: "PRO FEATURE",
    aiAudioEngine: "AI AUDIO ENGINE",
    opticalRecognition: "OPTICAL RECOGNITION",
    studioTool: "STUDIO TOOL",
    cameraMobile: "CAMERA & MOBILE",
    ecosystem: "ECOSYSTEM",
    freePlan: "FREE PLAN",
    support: "SUPPORT",

    // Sheet Music Hero
    proEngraving: "Professional engraving",
    heroTitle: "Transform MIDI into engraved sheet music",
    heroDesc: "Real-time playback, intelligent tuplet cleanup, automatic grand staff splitting, and export to MusicXML or MIDI.",
    dropTitle: "Drop your MIDI file here",
    dropRelease: "Release to engrave",
    browseDevice: "or browse from device",
    trySample: "Try a sample score",
    featureGrandStaff: "Grand staff split",
    featureTuplets: "Smart tuplets",
    featurePlayback: "Live playback",
    featureMusicXml: "MusicXML export",

    // Header actions
    uploadNewMidi: "Upload New MIDI",
    sampleButton: "Sample",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",

    // Virtual Piano
    virtualPianoTitle: "Virtual Piano Keyboard",
    keys88: "88 KEYS",
    playVirtualPiano: "Play the Virtual Piano",
    playing: "Playing",
    pianoSubtitle: "Play with mouse, computer keyboard (QWERTY), or plug in any real USB/Bluetooth MIDI keyboard.",
    songs: "Songs",
    stopSong: "Stop",
    pedalOn: "Pedal: ON",
    pedalOff: "Pedal: OFF",
    notes: "Notes",
    keys: "Keys",
    both: "Both",
    off: "Off",
    connectedStatus: "Connected",
    noMidiDetected: "Ready (No external MIDI keyboard detected)",
    scanningMidi: "Scanning for MIDI devices...",

    // Instruments
    grandPiano: "Grand Piano",
    rhodesPiano: "Rhodes E-Piano",
    warmStrings: "Warm Strings",
    churchOrgan: "Church Organ",
    celestaBells: "Celesta / Bells",
    retroSynth: "Retro Synth",
    gotIt: "Got it",
  },
  tr: {
    proStudio: "PRO STÜDYO",
    allTools: "Tüm Araçlar",
    pricing: "Fiyatlandırma",
    feedback: "Geri Bildirim",
    signIn: "Giriş Yap",
    logOut: "Çıkış Yap",
    upgradePro: "PRO'ya Yükselt",
    monthly: "Aylık",
    creditPack: "Kredi Paketi",
    resets: "Yenilenme",
    midiAndNotation: "MİDİ & NOTA YAZIMI",

    virtualPiano: "Sanal Piyano",
    midiToSheet: "MIDI'den Notaya",
    aiMidi: "Yapay Zeka MIDI",
    mp3ToMidi: "MP3'ten MIDI'ye",
    sheetToMidi: "Notadan MIDI'ye",
    midiEditor: "MIDI Düzenleyici",
    scanner: "Nota Tarayıcı",

    proFeature: "PRO ÖZELLİK",
    aiAudioEngine: "YAPAY ZEKA SES MOTORU",
    opticalRecognition: "OPTİK TANIMA (OMR)",
    studioTool: "STÜDYO ARACI",
    cameraMobile: "KAMERA & MOBİL",
    ecosystem: "EKOSİSTEM",
    freePlan: "ÜCRETSİZ PLAN",
    support: "DESTEK",

    proEngraving: "Profesyonel Nota Yazımı",
    heroTitle: "MIDI dosyalarınızı profesyonel notalara dönüştürün",
    heroDesc: "Gerçek zamanlı çalma, akıllı üçleme/kuple temizleme, otomatik çift porte bölme ve MusicXML / MIDI dışa aktarma.",
    dropTitle: "MIDI dosyanızı buraya sürükleyin",
    dropRelease: "Notaları oluşturmak için bırakın",
    browseDevice: "veya cihazınızdan seçin",
    trySample: "Örnek bir eser deneyin",
    featureGrandStaff: "Çift porte bölme",
    featureTuplets: "Akıllı kupleler",
    featurePlayback: "Canlı çalma",
    featureMusicXml: "MusicXML aktarımı",

    uploadNewMidi: "Yeni MIDI Yükle",
    sampleButton: "Örnek",
    fullscreen: "Tam Ekran",
    exitFullscreen: "Tam Ekrandan Çık",

    virtualPianoTitle: "Sanal Piyano Klavyesi",
    keys88: "88 TUŞ",
    playVirtualPiano: "Sanal Piyanoyu Çalın",
    playing: "Çalınıyor",
    pianoSubtitle: "Fareyle, bilgisayar klavyesiyle (QWERTY) veya USB/Bluetooth MIDI klavye bağlayarak çalın.",
    songs: "Şarkılar",
    stopSong: "Durdur",
    pedalOn: "Pedal: AÇIK",
    pedalOff: "Pedal: KAPALI",
    notes: "Notalar",
    keys: "Tuşlar",
    both: "Her İkisi",
    off: "Kapalı",
    connectedStatus: "Bağlandı",
    noMidiDetected: "Hazır (Harici MIDI klavye algılanmadı)",
    scanningMidi: "MIDI cihazları taranıyor...",

    grandPiano: "Kuyruklu Piyano",
    rhodesPiano: "Rhodes E-Piyano",
    warmStrings: "Sıcak Yaylılar",
    churchOrgan: "Kilise Orgu",
    celestaBells: "Çelesta / Çan",
    retroSynth: "Retro Sentezleyici",
    gotIt: "Anladım",
  },
  fr: {
    proStudio: "STUDIO PRO",
    allTools: "Tous les outils",
    pricing: "Tarifs",
    feedback: "Avis & Support",
    signIn: "Connexion",
    logOut: "Déconnexion",
    upgradePro: "Passer à PRO",
    monthly: "Mensuel",
    creditPack: "Pack de Crédits",
    resets: "Renouvellement",
    midiAndNotation: "MIDI & PARTITION",

    virtualPiano: "Piano Virtuel",
    midiToSheet: "MIDI en Partitions",
    aiMidi: "Générateur MIDI IA",
    mp3ToMidi: "MP3 en MIDI",
    sheetToMidi: "Partition en MIDI",
    midiEditor: "Éditeur MIDI",
    scanner: "Scanner de Partitions",

    proFeature: "FONCTION PRO",
    aiAudioEngine: "MOTEUR AUDIO IA",
    opticalRecognition: "RECONNAISSANCE OPTIQUE",
    studioTool: "OUTIL STUDIO",
    cameraMobile: "APPAREIL PHOTO & MOBILE",
    ecosystem: "ÉCOSYSTÈME",
    freePlan: "FORFAIT GRATUIT",
    support: "SUPPORT",

    proEngraving: "Gravure professionnelle",
    heroTitle: "Transformez vos fichiers MIDI en partitions gravées",
    heroDesc: "Lecture en direct, quantification intelligente, séparation automatique en double portée et export MusicXML ou MIDI.",
    dropTitle: "Déposez votre fichier MIDI ici",
    dropRelease: "Relâchez pour graver",
    browseDevice: "ou parcourez vos fichiers",
    trySample: "Essayer un exemple",
    featureGrandStaff: "Double portée",
    featureTuplets: "N-olets intelligents",
    featurePlayback: "Lecture en direct",
    featureMusicXml: "Export MusicXML",

    uploadNewMidi: "Charger un MIDI",
    sampleButton: "Exemple",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter plein écran",

    virtualPianoTitle: "Clavier de Piano Virtuel",
    keys88: "88 TOUCHES",
    playVirtualPiano: "Jouer du Piano Virtuel",
    playing: "Lecture",
    pianoSubtitle: "Jouez avec la souris, le clavier d'ordinateur (AZERTY/QWERTY) ou un clavier MIDI USB/Bluetooth.",
    songs: "Morceaux",
    stopSong: "Arrêter",
    pedalOn: "Pédale: OUI",
    pedalOff: "Pédale: NON",
    notes: "Notes",
    keys: "Touches",
    both: "Les Deux",
    off: "Désactivé",
    connectedStatus: "Connecté",
    noMidiDetected: "Prêt (Aucun contrôleur MIDI détecté)",
    scanningMidi: "Recherche de contrôleurs MIDI...",

    grandPiano: "Piano à Queue",
    rhodesPiano: "Piano Rhodes",
    warmStrings: "Cordes Chaleureuses",
    churchOrgan: "Orgue d'Église",
    celestaBells: "Célesta / Cloches",
    retroSynth: "Synthétiseur Rétro",
    gotIt: "Compris",
  },
  es: {
    proStudio: "ESTUDIO PRO",
    allTools: "Todas las herramientas",
    pricing: "Precios",
    feedback: "Comentarios",
    signIn: "Iniciar Sesión",
    logOut: "Cerrar Sesión",
    upgradePro: "Mejorar a PRO",
    monthly: "Mensual",
    creditPack: "Paquete de Créditos",
    resets: "Reinicio",
    midiAndNotation: "MIDI Y NOTACIÓN",

    virtualPiano: "Piano Virtual",
    midiToSheet: "MIDI a Partitura",
    aiMidi: "Generador MIDI IA",
    mp3ToMidi: "MP3 a MIDI",
    sheetToMidi: "Partitura a MIDI",
    midiEditor: "Editor MIDI",
    scanner: "Escáner de Partituras",

    proFeature: "FUNCIÓN PRO",
    aiAudioEngine: "MOTOR DE AUDIO IA",
    opticalRecognition: "RECONOCIMIENTO ÓPTICO",
    studioTool: "HERRAMIENTA DE ESTUDIO",
    cameraMobile: "CÁMARA Y MÓVIL",
    ecosystem: "ECOSISTEMA",
    freePlan: "PLAN GRATUITO",
    support: "SOPORTE",

    proEngraving: "Grabado profesional",
    heroTitle: "Convierte archivos MIDI en partituras profesionales",
    heroDesc: "Reproducción en tiempo real, limpieza inteligente de tresillos, división de clave doble y exportación a MusicXML o MIDI.",
    dropTitle: "Arrastra tu archivo MIDI aquí",
    dropRelease: "Suelta para procesar",
    browseDevice: "o selecciona desde tu equipo",
    trySample: "Probar una pieza de muestra",
    featureGrandStaff: "Clave doble",
    featureTuplets: "Tresillos inteligentes",
    featurePlayback: "Reproducción viva",
    featureMusicXml: "Exportar MusicXML",

    uploadNewMidi: "Subir Nuevo MIDI",
    sampleButton: "Muestra",
    fullscreen: "Pantalla completa",
    exitFullscreen: "Salir de pantalla completa",

    virtualPianoTitle: "Teclado de Piano Virtual",
    keys88: "88 TECLAS",
    playVirtualPiano: "Toca el Piano Virtual",
    playing: "Reproduciendo",
    pianoSubtitle: "Toca con el ratón, teclado de ordenador o cualquier teclado MIDI USB/Bluetooth.",
    songs: "Canciones",
    stopSong: "Detener",
    pedalOn: "Pedal: ACTIVADO",
    pedalOff: "Pedal: DESACTIVADO",
    notes: "Notas",
    keys: "Teclas",
    both: "Ambas",
    off: "Desactivado",
    connectedStatus: "Conectado",
    noMidiDetected: "Listo (Sin teclado MIDI externo)",
    scanningMidi: "Buscando dispositivos MIDI...",

    grandPiano: "Piano de Cola",
    rhodesPiano: "Piano Rhodes",
    warmStrings: "Cuerdas Cálidas",
    churchOrgan: "Órgano de Iglesia",
    celestaBells: "Celesta / Campanas",
    retroSynth: "Sintetizador Retro",
    gotIt: "Entendido",
  },
  de: {
    proStudio: "PRO STUDIO",
    allTools: "Alle Werkzeuge",
    pricing: "Preise",
    feedback: "Feedback",
    signIn: "Anmelden",
    logOut: "Abmelden",
    upgradePro: "Auf PRO upgraden",
    monthly: "Monatlich",
    creditPack: "Guthaben-Paket",
    resets: "Verlängerung",
    midiAndNotation: "MIDI & NOTENSATZ",

    virtualPiano: "Virtuelles Klavier",
    midiToSheet: "MIDI zu Noten",
    aiMidi: "KI-MIDI-Generator",
    mp3ToMidi: "MP3 zu MIDI",
    sheetToMidi: "Noten zu MIDI",
    midiEditor: "MIDI-Editor",
    scanner: "Noten-Scanner",

    proFeature: "PRO-FUNKTION",
    aiAudioEngine: "KI-AUDIO-ENGINE",
    opticalRecognition: "OPTISCHE NOTENERKENNUNG",
    studioTool: "STUDIO-WERKZEUG",
    cameraMobile: "KAMERA & MOBIL",
    ecosystem: "ÖKOSYSTEM",
    freePlan: "KOSTENLOSER PLAN",
    support: "SUPPORT",

    proEngraving: "Professioneller Notensatz",
    heroTitle: "Verwandeln Sie MIDI in professionell gravierte Noten",
    heroDesc: "Echtzeit-Wiedergabe, intelligente Triolen-Bereinigung, automatische Klaviersystem-Trennung und MusicXML-/MIDI-Export.",
    dropTitle: "MIDI-Datei hier ablegen",
    dropRelease: "Loslassen zum Notensatz",
    browseDevice: "oder vom Gerät auswählen",
    trySample: "Beispieldatei ausprobieren",
    featureGrandStaff: "Klaviersystem-Split",
    featureTuplets: "Smarte N-Tolen",
    featurePlayback: "Live-Wiedergabe",
    featureMusicXml: "MusicXML-Export",

    uploadNewMidi: "Neues MIDI laden",
    sampleButton: "Beispiel",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",

    virtualPianoTitle: "Virtuelle Klaviertastatur",
    keys88: "88 TASTEN",
    playVirtualPiano: "Virtuelles Klavier spielen",
    playing: "Spielt",
    pianoSubtitle: "Spielen Sie mit Maus, Computertastatur oder einem USB-/Bluetooth-MIDI-Keyboard.",
    songs: "Stücke",
    stopSong: "Stopp",
    pedalOn: "Pedal: AN",
    pedalOff: "Pedal: AUS",
    notes: "Noten",
    keys: "Tasten",
    both: "Beide",
    off: "Aus",
    connectedStatus: "Verbunden",
    noMidiDetected: "Bereit (Kein MIDI-Gerät erkannt)",
    scanningMidi: "Suche nach MIDI-Geräten...",

    grandPiano: "Flügel",
    rhodesPiano: "Rhodes E-Piano",
    warmStrings: "Warme Streicher",
    churchOrgan: "Kirchenorgel",
    celestaBells: "Celesta / Glocken",
    retroSynth: "Retro-Synthesizer",
    gotIt: "Verstanden",
  },
  it: {
    proStudio: "STUDIO PRO",
    allTools: "Tutti gli strumenti",
    pricing: "Prezzi",
    feedback: "Feedback",
    signIn: "Accedi",
    logOut: "Disconnetti",
    upgradePro: "Passa a PRO",
    monthly: "Mensile",
    creditPack: "Pacchetto Crediti",
    resets: "Rinnovo",
    midiAndNotation: "MIDI E NOTAZIONE",

    virtualPiano: "Pianoforte Virtuale",
    midiToSheet: "Da MIDI a Spartito",
    aiMidi: "Generatore MIDI IA",
    mp3ToMidi: "Da MP3 a MIDI",
    sheetToMidi: "Da Spartito a MIDI",
    midiEditor: "Editor MIDI",
    scanner: "Scanner di Spartiti",

    proFeature: "FUNZIONE PRO",
    aiAudioEngine: "MOTORE AUDIO IA",
    opticalRecognition: "RICONOSCIMENTO OTTICO",
    studioTool: "STRUMENTO DA STUDIO",
    cameraMobile: "FOTOCAMERA E DISPOSITIVI MOBILI",
    ecosystem: "ECOSISTEMA",
    freePlan: "PIANO GRATUITO",
    support: "SUPPORTO",

    proEngraving: "Incisione professionale",
    heroTitle: "Trasforma i file MIDI in spartiti professionali",
    heroDesc: "Riproduzione in tempo reale, quantizzazione intelligente, separazione doppio rigo ed esportazione MusicXML o MIDI.",
    dropTitle: "Trascina qui il tuo file MIDI",
    dropRelease: "Rilascia per incidere",
    browseDevice: "o sfoglia dal dispositivo",
    trySample: "Prova un brano di esempio",
    featureGrandStaff: "Doppio rigo",
    featureTuplets: "Gruppi irregolari",
    featurePlayback: "Riproduzione dal vivo",
    featureMusicXml: "Esporta MusicXML",

    uploadNewMidi: "Carica Nuovo MIDI",
    sampleButton: "Esempio",
    fullscreen: "Schermo intero",
    exitFullscreen: "Esci da schermo intero",

    virtualPianoTitle: "Tastiera di Pianoforte Virtuale",
    keys88: "88 TASTI",
    playVirtualPiano: "Suona il Pianoforte Virtuale",
    playing: "In riproduzione",
    pianoSubtitle: "Suona con il mouse, la tastiera del computer o una tastiera MIDI USB/Bluetooth.",
    songs: "Brani",
    stopSong: "Stop",
    pedalOn: "Pedale: ATTIVO",
    pedalOff: "Pedale: DISATTIVO",
    notes: "Note",
    keys: "Tasti",
    both: "Entrambi",
    off: "Disattivato",
    connectedStatus: "Connesso",
    noMidiDetected: "Pronto (Nessun controller MIDI rilevato)",
    scanningMidi: "Ricerca controller MIDI...",

    grandPiano: "Pianoforte a Coda",
    rhodesPiano: "Piano Rhodes",
    warmStrings: "Archi Caldi",
    churchOrgan: "Organo a Canne",
    celestaBells: "Celesta / Campanelli",
    retroSynth: "Sintetizzatore Retrò",
    gotIt: "Ho capito",
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: TranslationKey) => TRANSLATIONS.en[key] || (key as string),
  languages: LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tukanft_language") as Language | null;
      if (stored && TRANSLATIONS[stored]) {
        setLanguageState(stored);
      } else {
        // Auto-detect browser language if match found
        const browserLang = navigator.language.slice(0, 2).toLowerCase() as Language;
        if (TRANSLATIONS[browserLang]) {
          setLanguageState(browserLang);
        }
      }
    } catch (e) {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("tukanft_language", lang);
    } catch (e) {}
  };

  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
