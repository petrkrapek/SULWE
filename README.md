# Shrnutí stránky – rozšíření do Google Chrome

Rozšíření, které pomocí AI (Claude od Anthropic) shrne právě otevřenou webovou stránku
a zobrazí shrnutí v malém okně po kliknutí na ikonu rozšíření.

## Instalace (bez Chrome Web Store)

1. Stáhněte si tento repozitář (na GitHubu **Code → Download ZIP**) a rozbalte ho.
2. V Chromu otevřete `chrome://extensions`.
3. Vpravo nahoře zapněte **Režim pro vývojáře**.
4. Klikněte na **Načíst rozbalené** a vyberte složku `extension`.
5. Ikonu rozšíření si připněte na lištu (ikona puzzle → špendlík).

## První spuštění

1. Klikněte na ikonu rozšíření → **Otevřít nastavení**.
2. Vložte svůj API klíč z [console.anthropic.com](https://console.anthropic.com/settings/keys)
   (účet musí mít kredit).
3. Volitelně zvolte model, jazyk a délku shrnutí a klikněte na **Uložit**.

Pak stačí na libovolné stránce kliknout na ikonu – shrnutí se začne vypisovat okamžitě.

## Jak to funguje

- Po kliknutí na ikonu rozšíření přečte text aktuální stránky (jen té jedné, jen v tu chvíli –
  oprávnění `activeTab`).
- Text pošle přímo z prohlížeče do API Anthropic a shrnutí průběžně vypisuje do okna.
- Hotové shrnutí si pamatuje do zavření prohlížeče, takže opakované otevření nic nestojí.
  Tlačítko **Shrnout znovu** vytvoří nové.
- API klíč je uložený jen lokálně v prohlížeči (`chrome.storage.local`) a posílá se pouze
  na `api.anthropic.com`.

Rozšíření nefunguje na interních stránkách Chromu (`chrome://…`), v Chrome Web Store
a v zabudovaném prohlížeči PDF – Chrome tam rozšířením nedovolí číst obsah.

## Nastavení

| Volba | Možnosti |
|---|---|
| Model | Claude Opus 5.5 (výchozí, nejkvalitnější), Claude Sonnet 5.5, Claude Haiku 5.5 (nejlevnější) |
| Jazyk shrnutí | čeština, angličtina, jazyk stránky |
| Délka | krátké, střední, podrobné |

## Vývoj

Zdrojové kódy jsou ve složce `src/`, do `extension/dist/` se sestavují pomocí esbuild
(sestavené soubory jsou v repozitáři, aby šlo rozšíření načíst bez sestavování).

```bash
npm install
npm run build    # jednorázové sestavení
npm run watch    # průběžné sestavování při změnách
```

Po sestavení v `chrome://extensions` klikněte u rozšíření na ikonu obnovení.

```
extension/          ← tuto složku načítáte do Chromu
  manifest.json
  popup.html/.css   ← okno se shrnutím
  options.html      ← nastavení
  dist/             ← sestavený JavaScript
  icons/
src/
  popup.js          ← logika okna (čtení stránky, zobrazení shrnutí)
  summarize.js      ← volání Claude API a prompt
  markdown.js       ← bezpečné vykreslení Markdownu
  settings.js       ← nastavení a jejich výchozí hodnoty
  options.js        ← stránka nastavení
```
