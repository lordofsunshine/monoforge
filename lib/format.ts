export function formatBytes(value: bigint | number) {
  const bytes = typeof value === "bigint" ? Number(value) : value;
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size >= 10 || unit === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`;
}

export type FormatLocale = "en" | "ru";

export function formatDate(value: Date | string, locale: FormatLocale = "en") {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const pluralForms = {
  files: {
    en: ["file", "files"],
    ru: ["файл", "файла", "файлов"],
  },
  stars: {
    en: ["star", "stars"],
    ru: ["звезда", "звезды", "звезд"],
  },
  issues: {
    en: ["issue", "issues"],
    ru: ["обсуждение", "обсуждения", "обсуждений"],
  },
  openIssues: {
    en: ["open issue", "open issues"],
    ru: ["открытое обсуждение", "открытых обсуждения", "открытых обсуждений"],
  },
  fileChanged: {
    en: ["file changed", "files changed"],
    ru: ["файл изменен", "файла изменено", "файлов изменено"],
  },
  comments: {
    en: ["comment", "comments"],
    ru: ["комментарий", "комментария", "комментариев"],
  },
  repositories: {
    en: ["repository", "repositories"],
    ru: ["репозиторий", "репозитория", "репозиториев"],
  },
} as const;

export type CountUnit = keyof typeof pluralForms;

function ruPluralIndex(value: number) {
  const absolute = Math.abs(value);
  const mod10 = absolute % 10;
  const mod100 = absolute % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 0;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 1;
  }

  return 2;
}

export function formatCount(value: number, unit: CountUnit, locale: FormatLocale = "en") {
  const formattedNumber = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en").format(value);
  const forms = pluralForms[unit][locale];
  const label = locale === "ru" ? forms[ruPluralIndex(value)] : forms[value === 1 ? 0 : 1];

  return `${formattedNumber} ${label}`;
}
