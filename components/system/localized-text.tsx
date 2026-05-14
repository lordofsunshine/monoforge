"use client";

import { useI18n } from "@/components/system/preferences-provider";

type LocalizedTextProps = {
  path: string;
};

export function LocalizedText({ path }: LocalizedTextProps) {
  const { t } = useI18n();
  return <>{t(path)}</>;
}
