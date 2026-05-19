"use client";

import { formatCount, formatDate, type CountUnit } from "@/lib/format";
import { useI18n } from "@/components/system/preferences-provider";

type LocalizedDateProps = {
  value: Date | string;
};

type LocalizedCountProps = {
  value: number;
  unit: CountUnit;
};

export function LocalizedDate({ value }: LocalizedDateProps) {
  const { locale } = useI18n();

  return <>{formatDate(value, locale)}</>;
}

export function LocalizedCount({ value, unit }: LocalizedCountProps) {
  const { locale } = useI18n();

  return <>{formatCount(value, unit, locale)}</>;
}
