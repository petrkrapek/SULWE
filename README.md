# Shrnutí stránky – rozšíření do Google Chrome

Rozšíření, které pomocí AI (Claude od Anthropic) shrne právě otevřenou webovou stránku
a zobrazí shrnutí v malém okně po kliknutí na ikonu rozšíření. Volitelně umí přes
[TypeSafe AI](https://console.typesafe.ai/home) odhadnout, zda stránka nešíří fake news.

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

## Ověření fake news (volitelné)

1. V nastavení rozšíření vyplňte **API klíč TypeSafe AI** (získáte ho na
   [console.typesafe.ai](https://console.typesafe.ai/home)).
2. V okně rozšíření se objeví tlačítko **Ověřit**. Po kliknutí se nad shrnutím zobrazí
   řádek s výsledkem, např. `● Zavádějící · 72 % · manipulace výrazná`.

Výsledek je jedna ze čtyř kategorií – **Věrohodné**, **Názor / satira**, **Zavádějící**,
**Pravděpodobně fake news** – s pravděpodobností a mírou manipulativního jazyka.
Posuzuje ho rozhodovací model Jev (`POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`)
ze začátku textu stránky (prvních 20 000 znaků). Jde o automatický odhad, ne o ověření
faktů novinářem. Bez klíče TypeSafe je funkce vypnutá a tlačítko se nezobrazuje.

## Pin do Airtable (volitelné)

Tlačítko **Pin** uloží odkaz na stránku a její shrnutí do tabulky v [Airtable](https://airtable.com).

1. Na [airtable.com/create/tokens](https://airtable.com/create/tokens) vytvořte osobní přístupový token
   s oprávněními `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`
   a přidejte mu přístup ke své databázi (případně k pracovnímu prostoru).
2. V nastavení rozšíření vyplňte token a **databázi** – ID `app…` nebo rovnou adresu databáze
   z prohlížeče. Pokud databázi ještě nemáte, vložte ID pracovního prostoru `wsp…` a rozšíření
   při prvním Pinu založí databázi „Shrnutí stránek“.
3. Po dokončení shrnutí klikněte v okně na **Pin**.

Chování:
- Když tabulka (výchozí název „Shrnutí stránek“) neexistuje, založí se se sloupci
  **URL**, **Shrnutí** a **Datum a čas**. Datum a čas je systémový sloupec *Created time*,
  který Airtable vyplní sám. Pokud by ho API odmítlo vytvořit, založí se obyčejné datum
  a čas doplní rozšíření.
- Do existující tabulky se jen přidávají nové záznamy; chybějící sloupce se doplní,
  nic se nemaže ani nepřepisuje.
- Stejná adresa se uloží jen jednou – u už uložené stránky se zobrazí „Už připnuto“.
- Do Airtable se ukládá celá adresa stránky včetně parametrů, aby odkaz fungoval.

## Jak to funguje

- Po kliknutí na ikonu rozšíření přečte text aktuální stránky (jen té jedné, jen v tu chvíli –
  oprávnění `activeTab`).
- Text pošle přímo z prohlížeče do API Anthropic a shrnutí průběžně vypisuje do okna.
- Hotové shrnutí si pamatuje do zavření prohlížeče, takže opakované otevření nic nestojí.
  Tlačítko **Shrnout znovu** vytvoří nové.
- API klíče jsou uložené jen lokálně v prohlížeči (`chrome.storage.local`) a posílají se pouze
  na `api.anthropic.com`, `api.typesafe.ai`, resp. `api.airtable.com`.
- Adresa stránky se do API posílá bez parametrů a kotvy (`?…`, `#…`), protože v nich
  mohou být přihlašovací tokeny nebo osobní údaje.
- Stránky rozšíření mají přísnou Content Security Policy: smějí spouštět jen vlastní skripty
  a připojovat se jen k těmto třem API.

Rozšíření nefunguje na interních stránkách Chromu (`chrome://…`), v Chrome Web Store
a v zabudovaném prohlížeči PDF – Chrome tam rozšířením nedovolí číst obsah.

## Nastavení

| Volba | Možnosti |
|---|---|
| Model | Claude Opus 5.5 (výchozí, nejkvalitnější), Claude Sonnet 5.5, Claude Haiku 5.5 (nejlevnější) |
| Jazyk shrnutí | čeština, angličtina, jazyk stránky |
| Délka | krátké, střední, podrobné |

## Nahrání do Chrome Web Store

Do Developer Dashboardu se nahrává **jen ZIP s obsahem složky `extension`**, ne celý repozitář
(soubor `manifest.json` musí být v kořeni archivu). Hotový balíček je ve složce `release/`,
např. `release/shrnuti-stranky-0.3.0.zip`. Nový vytvoříte příkazem:

```bash
npm run zip      # sestaví kód a vytvoří release/shrnuti-stranky-<verze>.zip
```

Před každým dalším nahráním zvyšte `version` v `extension/manifest.json`.

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
  factcheck.js      ← ověření fake news přes TypeSafe AI (Jev)
  airtable.js       ← Pin: uložení odkazu a shrnutí do Airtable
  markdown.js       ← bezpečné vykreslení Markdownu
  page.js           ← očištění dat stránky před odesláním (adresa bez parametrů)
  settings.js       ← nastavení a jejich výchozí hodnoty
  options.js        ← stránka nastavení
```
