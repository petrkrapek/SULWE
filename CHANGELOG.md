# Changelog

Všechny podstatné změny rozšíření **Shrnutí stránky** jsou zapsané v tomto souboru.

Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.1.0/)
a projekt používá [sémantické verzování](https://semver.org/lang/cs/).

## [Unreleased]

## [0.5.4] – 2026-10-16

### Přidáno
- Výběr poskytovatele AI pro shrnutí: kromě Anthropic (Claude) i OpenAI (GPT-6 Astra,
  GPT-6.1 Sol, GPT-5.6 Terra, GPT-6 Luna). V nastavení funguje stejně jako výběr cíle
  Pinu – zobrazí se jen klíč a model zvoleného poskytovatele a oba si pamatují své údaje
  zvlášť. Automatická volba modelu vybírá podle náročnosti textu model zvoleného
  poskytovatele. Stávající nastavení zůstává u Anthropic.
- Automatické vytvoření GitHub Release (GitHub Actions): po změně verze v `manifest.json`
  v `master` workflow spustí testy, sestaví ZIP, vezme poznámky z CHANGELOG.md a založí
  release se značkou `vX.Y.Z`.
- Kontrola pull requestů (GitHub Actions): ESLint, Prettier, unit testy a ověření,
  že `extension/dist/` odpovídá zdrojům.
- Unit testy pro ošetření dat stránky, vykreslení Markdownu, Pin do Airtable a Craft
  a nastavení.
- Dependabot pro npm závislosti a GitHub Actions.
- Licence Apache 2.0 (`LICENSE`, `NOTICE`).

### Změněno
- Rozšíření nově potřebuje oprávnění pro `api.openai.com` (volá se jen při zvoleném
  poskytovateli OpenAI); Chrome může po aktualizaci požádat o jeho potvrzení.
- Pin se po minutě bez odpovědi služby přeruší se srozumitelnou hláškou, místo aby
  tlačítko zůstalo ve stavu „Ukládám…“.
- Zásady ochrany osobních údajů popisují i shrnutí přes OpenAI, automatickou volbu
  modelu (TypeSafe AI) a Pin do Airtable a Craft.
- Jediným zdrojem čísla verze je `extension/manifest.json` (`package.json` verzi nemá);
  požadovaná verze Node.js je v `.nvmrc` a `package.json` (`engines`).

### Odstraněno
- Složka `release/` s balíčky ZIP už není součástí repozitáře – hotové balíčky jsou
  na stránce [Releases](https://github.com/petrkrapek/SULWE/releases).

## [0.5.3] – 2026-10-10

### Opraveno
- Craft: když je cílová denní poznámka v koši, okno místo technické chyby
  „Craft požadavek odmítl (400)“ vysvětlí, že je potřeba poznámku v Craft obnovit
  nebo z koše trvale smazat.
- Craft: text chyby se čte i z odpovědí ve tvaru `{"errors": [...]}`, takže jsou
  čitelnější i ostatní chybové hlášky.

## [0.5.2] – 2026-10-10

### Přidáno
- Craft: volba **Jak ukládat** – *Nový dokument* (pro připojení ke všem dokumentům)
  nebo *Denní poznámka* (pro připojení Daily Notes & Tasks).

### Změněno
- Výchozí režim Craft je opět *Nový dokument* (chování verze 0.5.0).

## [0.5.1] – 2026-10-10

### Přidáno
- Craft: ukládání jako podstránka na konec dnešního denního zápisu (Daily Note) podle
  oficiální dokumentace Craft API.
- Nastavení přijme i adresu dokumentace připojení (`…/link/…/docs/v1`) a převede ji
  na adresu API.

### Změněno
- Craft: API klíč připojení je povinný; bez něj se tlačítko Pin nezobrazí.

### Opraveno
- Craft: závorky a mezery v adrese stránky se v odkazu správně kódují.

## [0.5.0] – 2026-10-10

### Přidáno
- Pin: volba cíle **Airtable** nebo **Craft**. Pin do Craft založí nový dokument
  pojmenovaný podle stránky s odkazem, shrnutím a časem uložení.
- Oprávnění pro `connect.craft.do`.

### Změněno
- Stav „Připnuto“ se pamatuje zvlášť pro každý cíl.

## [0.4.2] – 2026-10-10

### Změněno
- Názvy modelů se zobrazují bez předpony „Claude“ (Opus 5.5, Sonnet 5.5, Haiku 5.5)
  ve výběru modelu, v okně se shrnutím i v upozorněních.

## [0.4.1] – 2026-10-10

### Opraveno
- Okno už neroluje dvakrát, když je zobrazené ověření i Pin: celé okno se vejde
  do limitu 600 px a roluje jen shrnutí.

### Změněno
- Informace o modelu a uložení se přesunula pod název stránky; patička obsahuje jen
  tlačítka na jednom řádku.
- Tlačítko Pin po uložení vždy ukáže „Připnuto ✓“ (podrobnosti v bublině).

## [0.4.0] – 2026-10-10

### Přidáno
- **Automatická volba modelu podle textu**: TypeSafe AI posoudí náročnost stránky –
  běžné zprávy shrne Haiku 5.5, odbornější články Sonnet 5.5 a vysoce odborné texty
  Opus 5.5. Bez klíče TypeSafe nebo při chybě se použije Sonnet 5.5 s upozorněním.

## [0.3.1] – 2026-10-10 [YANKED]

Úprava výšky okna, na přání vrácena zpět. Řešení přinesla až verze 0.4.1.

## [0.3.0] – 2026-10-10

### Přidáno
- **Pin do Airtable**: uloží odkaz a shrnutí stránky do tabulky. Chybějící tabulku
  založí (sloupce URL, Shrnutí a systémový Datum a čas), případně založí i celou
  databázi v zadaném pracovním prostoru.
- Do existující tabulky se jen přidávají záznamy; stejná adresa se neuloží dvakrát.
- Oprávnění pro `api.airtable.com`.

### Změněno
- Tlačítko „Shrnout znovu“ přejmenováno na „Znovu“.

## [0.2.0] – 2026-10-10

### Přidáno
- **Ověření fake news** přes TypeSafe AI (model Jev): tlačítko *Ověřit* zařadí stránku
  jako věrohodnou, názor/satiru, zavádějící nebo pravděpodobné fake news a odhadne
  míru manipulativního jazyka.
- Příkaz `npm run zip` a hotový balíček pro Chrome Web Store ve složce `release/`.

### Zabezpečení
- Adresa stránky se do AI služeb posílá bez parametrů a kotvy (tokeny, osobní údaje).
- Text stránky nemůže uzavřít strukturální značky v promptu.
- Model Jev bere pokusy stránky ovlivnit hodnocení jako známku manipulace.
- Přísná Content Security Policy – stránky rozšíření se smějí připojit jen
  k potřebným API.

## [0.1.0] – 2026-10-10

### Přidáno
- První verze rozšíření: po kliknutí na ikonu přečte text aktuální stránky a pomocí AI
  zobrazí průběžně vypisované shrnutí v malém okně.
- Nastavení API klíče, modelu, jazyka (čeština, angličtina, jazyk stránky) a délky
  shrnutí (krátké, střední, podrobné).
- Kopírování shrnutí a jeho opětovné vytvoření.
- Hotová shrnutí se pamatují do zavření prohlížeče.

[Unreleased]: https://github.com/petrkrapek/SULWE/compare/v0.5.4...master
[0.5.4]: https://github.com/petrkrapek/SULWE/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/petrkrapek/SULWE/compare/62697f8...b224fd5
[0.5.2]: https://github.com/petrkrapek/SULWE/compare/f787a91...62697f8
[0.5.1]: https://github.com/petrkrapek/SULWE/compare/0e1d25d...f787a91
[0.5.0]: https://github.com/petrkrapek/SULWE/compare/e4f9fa1...0e1d25d
[0.4.2]: https://github.com/petrkrapek/SULWE/compare/f4a1605...e4f9fa1
[0.4.1]: https://github.com/petrkrapek/SULWE/compare/39ac7a2...f4a1605
[0.4.0]: https://github.com/petrkrapek/SULWE/compare/1e11b85...39ac7a2
[0.3.1]: https://github.com/petrkrapek/SULWE/commit/4be1996
[0.3.0]: https://github.com/petrkrapek/SULWE/compare/992f88a...8417e6a
[0.2.0]: https://github.com/petrkrapek/SULWE/compare/8a6169d...992f88a
[0.1.0]: https://github.com/petrkrapek/SULWE/commit/8a6169d
