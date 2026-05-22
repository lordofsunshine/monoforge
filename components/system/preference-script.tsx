export function PreferenceScript({ nonce }: { nonce?: string | null }) {
  const code = `
(function(){
  try {
    var storedTheme = localStorage.getItem("monoforge-theme");
    var theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    var storedLocale = localStorage.getItem("monoforge-locale");
    var locale = storedLocale === "en" || storedLocale === "ru" ? storedLocale : ((navigator.language || "en").toLowerCase().indexOf("ru") === 0 ? "ru" : "en");
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  } catch (error) {}
})();
`;

  return <script nonce={nonce ?? undefined}>{code}</script>;
}
