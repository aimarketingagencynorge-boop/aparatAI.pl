
import { Language } from './types';

// Added missing Norwegian (no) and Russian (ru) translations to fulfill the Language type requirements
export const translations: Record<Language, any> = {
  pl: {
    appName: "Mój Aparat",
    tagline: "Twoje inteligentne studio w kieszeni",
    freeOffer: "Pierwsze 20 ujęć w prezencie",
    ctaStart: "Uruchom Obiektyw",
    heroDesc: "Zmień zwykłe zdjęcia z telefonu w profesjonalne sesje produktowe 4K. Wykorzystaj magię inteligentnego oświetlenia Neural Lighting.",
    login: {
      title: "DOSTĘP AUTORYZOWANY",
      desc: "Wprowadź kod dostępu do systemów inżynieryjnych",
      placeholder: "HASŁO SYSTEMOWE",
      submit: "ZALOGUJ DO APARAT_CORE",
      error: "BŁĘDNY KOD DOSTĘPU",
      back: "Wróć do strony głównej",
      guest: "Kontynuuj jako Gość"
    },
    video: {
      generate: "WYWOŁAJ WIDEO",
      loading: "Przygotowywanie animacji...",
      step1: "Analizowanie geometrii produktu...",
      step2: "Generowanie klatek Neural Video...",
      step3: "Finalizowanie renderu 1080p...",
      waitInfo: "To może potrwać do 2-3 minut. Nie zamykaj okna."
    },
    health: {
      title: "CENTRUM DOWODZENIA",
      desc: "Monitoruj parametry optyki, płatności i wydajność silnika AI.",
      runAudit: "DIAGNOSTYKA SYSTEMU",
      led: "Status Aparatu",
      latency: "Opóźnienie AI",
      stripeStatus: "Łącze Płatnicze",
      storage: "Pamięć Chmury",
      debuggerTitle: "ANALIZA ZDARZEŃ",
      debuggerDesc: "Oczekiwanie na analizę procesów wywoływania..."
    },
    brandKit: {
      title: "TWOJA MARKA",
      desc: "Zdefiniuj stałą tożsamość wizualną swoich zdjęć.",
      bgColor: "DOMYŚLNE TŁO MARKI",
      reference: "MOODBOARD / REFERENCJA",
      presets: "MOJE STYLE",
      urbanMinimal: "Miejski Minimalizm",
      uploadPrompt: "Wgraj wzorzec stylu",
    },
    nav: {
      studio: "Ciemnia AI",
      menu: "Skaner Menu",
      social: "Publikator",
      billing: "Klisze i Pakiety",
      dashboard: "Panel Sterowania",
      health: "Centrum Dowodzenia"
    },
    studio: {
      workspace: "Twoje ujęcia",
      projects: "zdjęć",
      add: "Dodaj",
      batch: "Seria",
      ready: "Gotowy",
      rendered: "Wywołano 4K",
      generate: "WYWOŁAJ MASTERA",
      regenerate: "PSTRYKNIJ PONOWNIE!",
      download: "Pobierz 4K",
      analyzing: "Ustawianie ostrości...",
      rawInput: "Surowy negatyw",
      lightingOptimized: "OPTYMALIZACJA",
      atmosphere: "OŚWIETLENIE",
      composition: "KOMPOZYCJA",
      scenography: "SCENOGRAFIA",
      presentation: "EKSPOZYCJA PRODUKTU",
      format: "PROPORCJE (ASPECT RATIO)",
      outputParams: "PARAMETRY WYWOŁYWANIA",
      quality: "PROFIL JAKOŚCI",
      quality_web: "DO SKLEPU (WEB)",
      quality_social: "DO SOCIAL MEDIA",
      quality_ultra: "ULTRA 4K / DRUK",
      fileSize: "WAGA PLIKU",
      proTip: "WSKAZÓWKA",
      proTipContent: "Użyj 'Oslo Minimal', aby uzyskać czysty, naturalny wygląd idealny do fotografii kulinarnej.",
      savePreset: "ZAPISZ USTAWIENIA",
      lighting: {
        golden: "ZŁOTA GODZINA",
        soft: "MIĘKKIE STUDIO",
        noir: "DRAMATYCZNY NOIR",
        window: "ŚWIATŁO OKIENNE"
      },
      angles: {
        table: "POZIOM BLATU",
        flatlay: "Z GÓRY (FLATLAY)",
        macro: "MAKRO / DETAL"
      }
    },
    billing: {
      title: "Pakiety i Klisze",
      desc: "Wybierz zapas wirtualnych klisz dopasowany do Twoich potrzeb.",
      starter: "Pakiet Startowy",
      pro: "Studio Pro",
      enterprise: "Biznes AI",
      free: "0 PLN",
      perMonth: "/mc",
      welcomePack: "PAKIET POWITALNY",
      choosePlan: "WYBIERZ PAKIET",
      contact: "KONTAKT",
      extraPack: "Dokup klisze",
      buyPack: "DOPŁAĆ +20 UJĘĆ"
    },
    camera: {
      upload: "Wgraj Zdjęcie",
      library: "Otwórz Rolkę Aparatu",
      back: "Wróć do obiektywu",
      analyzingDna: "Analiza struktury",
      mapping: "Mapowanie oświetlenia i tekstur..."
    },
    social: {
      stylizer: "Kreator Kampanii",
      campaignStyle: "Wybierz Charakter",
      brandKit: "Styl Marki Aktywny",
      buildAssets: "Przygotuj Posty",
      proposals: "Propozycje Opisów",
      pushToSocial: "WYŚLIJ W ŚWIAT"
    },
    menu: {
      inputTitle: "MENU INPUT",
      inputDesc: "Importuj i analizuj dane z Twojego menu.",
      placeholder: "Wklej menu tutaj lub wgraj zdjęcie...",
      analyze: "ANALIZUJ MENU",
      scan: "Skanuj Menu",
      parsedDishes: "WYKRYTE DANIA",
      pstryknijWszystko: "PSTRYKNIJ WSZYSTKO",
      refresh: "ODŚWIEŻ UJĘCIE",
      pstryknijDanie: "PSTRYKNIJ DANIE",
      noDishes: "Brak wykrytych dań.",
      errorExtraction: "Nie udało się odczytać tekstu z obrazu.",
      inputLabel: "Tekst lub Obraz"
    }
  },
  en: {
    appName: "My AI Camera",
    tagline: "Your intelligent pocket studio",
    freeOffer: "First 20 shots for free",
    ctaStart: "Launch Lens",
    heroDesc: "Turn ordinary phone photos into professional 4K product sessions with the magic of Neural Lighting.",
    login: {
      title: "AUTHORIZED ACCESS",
      desc: "Enter system password to access engineering core",
      placeholder: "SYSTEM PASSWORD",
      submit: "LOG IN TO CAMERA_CORE",
      error: "INVALID ACCESS CODE",
      back: "Back to landing",
      guest: "Continue as Guest"
    },
    video: {
      generate: "GENERATE VIDEO",
      loading: "Preparing animation...",
      step1: "Analyzing product geometry...",
      step2: "Generating Neural Video frames...",
      step3: "Finalizing 1080p render...",
      waitInfo: "This may take 2-3 minutes. Please stay on this page."
    },
    health: {
      title: "MISSION CONTROL",
      desc: "Monitor API status, Stripe connectivity and AI performance.",
      runAudit: "RUN_DIAGNOSTICS",
      led: "Camera Status",
      latency: "AI Latency",
      stripeStatus: "Payment_Link",
      storage: "Cloud Storage",
      debuggerTitle: "EVENT_LOGS",
      debuggerDesc: "Awaiting rendering process analysis..."
    },
    brandKit: {
      title: "BRAND IDENTITY",
      desc: "Define your brand's visual signature.",
      bgColor: "BRAND BACKGROUND",
      reference: "MOODBOARD",
      presets: "MY STYLES",
      urbanMinimal: "Urban Minimalism",
      uploadPrompt: "Upload style reference",
    },
    nav: {
      studio: "AI Darkroom",
      menu: "Menu Scanner",
      social: "Publisher",
      billing: "Credits & Plans",
      dashboard: "Dashboard",
      health: "Mission Control"
    },
    studio: {
      workspace: "Workspace",
      projects: "shots",
      add: "Add",
      batch: "Batch",
      ready: "Ready",
      rendered: "4K Rendered",
      generate: "DEVELOP MASTER",
      regenerate: "SHOOT AGAIN!",
      download: "Download 4K",
      analyzing: "Focusing...",
      rawInput: "Raw Negative",
      lightingOptimized: "OPTIMIZED",
      atmosphere: "LIGHTING",
      composition: "COMPOSITION",
      scenography: "SCENOGRAPHY",
      presentation: "PRESENTATION MODE",
      format: "ASPECT RATIO",
      outputParams: "DEVELOPMENT PARAMS",
      quality: "QUALITY PROFILE",
      quality_web: "WEB STORE",
      quality_social: "SOCIAL MEDIA",
      quality_ultra: "ULTRA 4K / PRINT",
      fileSize: "FILE SIZE",
      proTip: "PRO TIP",
      proTipContent: "Use 'Oslo Minimal' for a clean, natural look perfect for food photography.",
      savePreset: "SAVE SETTINGS",
      lighting: {
        golden: "GOLDEN HOUR",
        soft: "STUDIO SOFT",
        noir: "DRAMATIC NOIR",
        window: "WINDOW LIGHT"
      },
      angles: {
        table: "TABLE LEVEL",
        flatlay: "FLATLAY",
        macro: "MACRO FOCUS"
      }
    },
    billing: {
      title: "Plans & Credits",
      desc: "Choose the virtual film supply for your needs.",
      starter: "Starter Pack",
      pro: "Pro Studio",
      enterprise: "Enterprise AI",
      free: "0 USD",
      perMonth: "/mo",
      welcomePack: "WELCOME PACK",
      choosePlan: "CHOOSE PLAN",
      contact: "CONTACT",
      extraPack: "Top Up",
      buyPack: "BUY +20 PACK"
    },
    camera: {
      upload: "Upload Photo",
      library: "Camera Roll",
      back: "Back to lens",
      analyzingDna: "Analyzing DNA",
      mapping: "Mapping textures & light..."
    },
    social: {
      stylizer: "Campaign Creator",
      campaignStyle: "Select Character",
      brandKit: "Brand Kit Active",
      buildAssets: "Build Campaign",
      proposals: "AI Copy",
      pushToSocial: "PUBLISH"
    },
    menu: {
      inputTitle: "MENU INPUT",
      inputDesc: "Import and analyze your menu data.",
      placeholder: "Paste menu here or upload image...",
      analyze: "ANALYZE MENU",
      scan: "Scan Menu",
      parsedDishes: "PARSED DISHES",
      pstryknijWszystko: "SHOOT ALL",
      refresh: "REFRESH SHOT",
      pstryknijDanie: "SHOOT DISH",
      noDishes: "No dishes parsed yet.",
      errorExtraction: "Failed to extract text from image.",
      inputLabel: "Text or Image"
    }
  },
  no: {
    appName: "Mitt AI-kamera",
    tagline: "Ditt intelligente lomme-studio",
    freeOffer: "De første 20 bildene er gratis",
    ctaStart: "Start linsen",
    heroDesc: "Forvandle vanlige telefonbilder til profesjonelle 4K-produktøkter med magien i Neural Lighting.",
    login: {
      title: "AUTORISERT TILGANG",
      desc: "Skriv inn systempassordet for å få tilgang til ingeniørkjernen",
      placeholder: "SYSTEMPASSORD",
      submit: "LOGG INN PÅ CAMERA_CORE",
      error: "UGYLDIG TILGANGSKODE",
      back: "Tilbake til startsiden",
      guest: "Fortsett som gjest"
    },
    video: {
      generate: "GENERER VIDEO",
      loading: "Forbereder animasjon...",
      step1: "Analyserer produktgeometri...",
      step2: "Genererer Neural Video-rammer...",
      step3: "Fullfører 1080p-gjengivelse...",
      waitInfo: "Dette kan ta 2-3 minutter. Vennligst bli på denne siden."
    },
    health: {
      title: "OPPDRAGSKONTROLL",
      desc: "Overvåk API-status, Stripe-tilkobling og AI-ytelse.",
      runAudit: "KJØR_DIAGNOSTIKK",
      led: "Kamerastatus",
      latency: "AI-forsinkelse",
      stripeStatus: "Betalingslenke",
      storage: "Skylagring",
      debuggerTitle: "HENDELSESLOGGER",
      debuggerDesc: "Venter på analyse av gjengivelsesprosessen..."
    },
    brandKit: {
      title: "BRANDIDENTITET",
      desc: "Definer merkevarens visuelle signatur.",
      bgColor: "MERKEVAREBAKGRUNN",
      reference: "MOODBOARD",
      presets: "MINE STILER",
      urbanMinimal: "Urban Minimalisme",
      uploadPrompt: "Last opp stilreferanse",
    },
    nav: {
      studio: "AI Mørkerom",
      menu: "Menyskanner",
      social: "Utgiver",
      billing: "Kreditter og planer",
      dashboard: "Dashbord",
      health: "Oppdragskontroll"
    },
    studio: {
      workspace: "Arbeidsområde",
      projects: "bilder",
      add: "Legg til",
      batch: "Batch",
      ready: "Klar",
      rendered: "4K-gjengitt",
      generate: "UTVIKLE MASTER",
      regenerate: "SKYT IGJEN!",
      download: "Last ned 4K",
      analyzing: "Fokuserer...",
      rawInput: "Rått negativ",
      lightingOptimized: "OPTIMALISERT",
      atmosphere: "BELYSNING",
      composition: "KOMPOSISJON",
      scenography: "SCENOGRAFI",
      presentation: "PRESENTASJONSMODUS",
      format: "STØRRELSESFORHOLD",
      outputParams: "UTVIKLINGSPARAMETERE",
      quality: "KVALITETSPROFIL",
      quality_web: "NETTBUTIKK",
      quality_social: "SOSIALE MEDIER",
      quality_ultra: "ULTRA 4K / UTSKRIFT",
      fileSize: "FILSTØRRELSE",
      proTip: "PRO-TIPS",
      proTipContent: "Bruk 'Oslo Minimal' for et rent, naturlig utseende som er perfekt for matfotografering.",
      savePreset: "LAGRE INNSTILLINGER",
      lighting: {
        golden: "GYLLEN TIME",
        soft: "MYKT STUDIO",
        noir: "DRAMATISK NOIR",
        window: "VINDUESLYS"
      },
      angles: {
        table: "BORDNIVÅ",
        flatlay: "FLATLAY",
        macro: "MAKROFOKUS"
      }
    },
    billing: {
      title: "Planer og kreditter",
      desc: "Velg den virtuelle filmforsyningen for dine behov.",
      starter: "Startpakke",
      pro: "Pro Studio",
      enterprise: "Enterprise AI",
      free: "0 NOK",
      perMonth: "/mnd",
      welcomePack: "VELKOMSTPAKKE",
      choosePlan: "VELG PLAN",
      contact: "KONTAKT",
      extraPack: "Fyll på",
      buyPack: "KJØP +20 PAKKE"
    },
    camera: {
      upload: "Last opp bilde",
      library: "Kamerarull",
      back: "Tilbake til linsen",
      analyzingDna: "Analyserer DNA",
      mapping: "Kartlegger teksturer og lys..."
    },
    social: {
      stylizer: "Kampanjeskaper",
      campaignStyle: "Velg karakter",
      brandKit: "Brand Kit aktivt",
      buildAssets: "Bygg kampanje",
      proposals: "AI-kopi",
      pushToSocial: "PUBLISER"
    }
  },
  ru: {
    appName: "Моя AI Камера",
    tagline: "Ваша интеллектуальная карманная студия",
    freeOffer: "Первые 20 снимков бесплатно",
    ctaStart: "Запустить объектив",
    heroDesc: "Превратите обычные фотографии с телефона в профессиональные фотосессии товаров в 4K с помощью магии нейронного освещения.",
    login: {
      title: "АВТОРИЗОВАННЫЙ ДОСТУП",
      desc: "Введите системный пароль для доступа к инженерному ядру",
      placeholder: "СИСТЕМНЫЙ ПАРОЛЬ",
      submit: "ВОЙТИ В CAMERA_CORE",
      error: "НЕВЕРНЫЙ КОД ДОСТУПА",
      back: "Назад на главную",
      guest: "Продолжить как гость"
    },
    video: {
      generate: "СОЗДАТЬ ВИДЕО",
      loading: "Подготовка анимации...",
      step1: "Анализ геометрии продукта...",
      step2: "Генерация кадров нейронного видео...",
      step3: "Финализация рендеринга 1080p...",
      waitInfo: "Это может занять 2-3 минуты. Пожалуйста, оставайтесь на этой странице."
    },
    health: {
      title: "ЦЕНТР УПРАВЛЕНИЯ",
      desc: "Мониторинг статуса API, подключение Stripe и производительность AI.",
      runAudit: "ЗАПУСТИТЬ_ДИАГНОСТИКУ",
      led: "Статус камеры",
      latency: "Задержка AI",
      stripeStatus: "Платежная ссылка",
      storage: "Облачное хранилище",
      debuggerTitle: "ЖУРНАЛ_СОБЫТИЙ",
      debuggerDesc: "Ожидание анализа процесса рендеринга..."
    },
    brandKit: {
      title: "БРЕНД-АЙДЕНТИКА",
      desc: "Определите визуальную подпись вашего бренда.",
      bgColor: "ФОН БРЕНДА",
      reference: "МУДБОРД",
      presets: "МОИ СТИЛИ",
      urbanMinimal: "Городской минимализм",
      uploadPrompt: "Загрузить референс стиля",
    },
    nav: {
      studio: "AI Фотостудия",
      menu: "Сканер меню",
      social: "Публикация",
      billing: "Кредиты и тарифы",
      dashboard: "Панель управления",
      health: "Центр управления"
    },
    studio: {
      workspace: "Рабочее пространство",
      projects: "снимков",
      add: "Добавить",
      batch: "Пакет",
      ready: "Готово",
      rendered: "Рендеринг 4K завершен",
      generate: "РАЗРАБОТАТЬ МАСТЕР-КОПИЮ",
      regenerate: "СНЯТЬ СНОВА!",
      download: "Скачать 4K",
      analyzing: "Фокусировка...",
      rawInput: "Сырой негатив",
      lightingOptimized: "ОПТИМИЗИРОВАНО",
      atmosphere: "ОСВЕЩЕНИЕ",
      composition: "КОМПОЗИЦИЯ",
      scenography: "СЦЕНОГРАФИЯ",
      presentation: "РЕЖИМ ПРЕЗЕНТАЦИИ",
      format: "СООТНОШЕНИЕ СТОРОН",
      outputParams: "ПАРАМЕТРЫ ОБРАБОТКИ",
      quality: "ПРОФИЛЬ КАЧЕСТВА",
      quality_web: "ВЕБ-МАГАЗИН",
      quality_social: "СОЦИАЛЬНЫЕ СЕТИ",
      quality_ultra: "ULTRA 4K / ПЕЧАТЬ",
      fileSize: "РАЗМЕР ФАЙЛА",
      proTip: "СОВЕТ ПРОФИ",
      proTipContent: "Используйте 'Oslo Minimal' для чистого, естественного вида, идеально подходящего для фуд-фотографии.",
      savePreset: "СОХРАНИТЬ НАСТРОЙКИ",
      lighting: {
        golden: "ЗОЛОТОЙ ЧАС",
        soft: "МЯГКАЯ СТУДИЯ",
        noir: "ДРАМАТИЧЕСКИЙ НУАР",
        window: "ОКОННЫЙ СВЕТ"
      },
      angles: {
        table: "УРОВЕНЬ СТОЛА",
        flatlay: "ВИД СВЕРХУ (FLATLAY)",
        macro: "МАКРОФОКУС"
      }
    },
    billing: {
      title: "Тарифы и кредиты",
      desc: "Выберите запас виртуальной пленки для ваших нужд.",
      starter: "Стартовый пакет",
      pro: "Про Студия",
      enterprise: "Бизнес AI",
      free: "0 РУБ",
      perMonth: "/мес",
      welcomePack: "ПРИВЕТСТВЕННЫЙ ПАКЕТ",
      choosePlan: "ВЫБРАТЬ ТАРИФ",
      contact: "КОНТАКТЫ",
      extraPack: "Пополнить",
      buyPack: "КУПИТЬ ПАКЕТ +20"
    },
    camera: {
      upload: "Загрузить фото",
      library: "Галерея",
      back: "Назад к объективу",
      analyzingDna: "Анализ структуры",
      mapping: "Картирование текстур и света..."
    },
    social: {
      stylizer: "Создатель кампаний",
      campaignStyle: "Выбрать характер",
      brandKit: "Brand Kit активен",
      buildAssets: "Создать кампанию",
      proposals: "AI Тексты",
      pushToSocial: "ОПУБЛИКОВАТЬ"
    }
  }
};
