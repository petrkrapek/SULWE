// Úprava manifestu z Chromu pro Safari (Safari Web Extension, Manifest V3).

// Nejstarší Safari, které umí vše, co rozšíření používá (storage.session, scripting.executeScript).
export const SAFARI_MIN_VERSION = "16.4";

/** Vrátí kopii manifestu upravenou pro Safari; vstup nemění. */
export function toSafariManifest(manifest) {
  const { options_page: optionsPage, ...rest } = structuredClone(manifest);
  return {
    ...rest,
    // Nastavení se v Safari otevírá přes options_ui (v samostatné záložce).
    ...(optionsPage && { options_ui: { page: optionsPage, open_in_tab: true } }),
    browser_specific_settings: {
      ...rest.browser_specific_settings,
      safari: { strict_min_version: SAFARI_MIN_VERSION },
    },
  };
}
