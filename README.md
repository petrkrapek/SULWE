# Shrnu.to – shrnutí stránky

[![Poslední verze](https://img.shields.io/github/v/release/petrkrapek/SULWE?label=verze)](https://github.com/petrkrapek/SULWE/releases/latest)
[![CI](https://github.com/petrkrapek/SULWE/actions/workflows/ci.yml/badge.svg)](https://github.com/petrkrapek/SULWE/actions/workflows/ci.yml)
[![Release](https://github.com/petrkrapek/SULWE/actions/workflows/release.yml/badge.svg)](https://github.com/petrkrapek/SULWE/actions/workflows/release.yml)
[![Licence](https://img.shields.io/badge/licence-Apache--2.0-blue)](LICENSE)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)

Rozšíření do Google Chrome, které jedním kliknutím shrne právě otevřenou webovou stránku pomocí AI
a zobrazí shrnutí v malém okně. Volitelně odhadne věrohodnost stránky, samo vybere
vhodný model podle náročnosti textu a uloží odkaz se shrnutím do Airtable, Craft nebo Notion.

**Aktuální verze:** [0.5.6](https://github.com/petrkrapek/SULWE/releases/tag/v0.5.6) ·
[stáhnout ZIP](https://github.com/petrkrapek/SULWE/releases/latest) ·
historie změn v [CHANGELOG.md](CHANGELOG.md)

## Funkce

| Funkce | Popis | Potřebujete |
|---|---|---|
| **Shrnutí stránky** | průběžně vypisované shrnutí v okně rozšíření; kopírování, opětovné vytvoření | API klíč Anthropic, OpenAI, nebo Mistral |
| **Ověření fake news** | tlačítko *Ověřit* odhadne věrohodnost stránky a míru manipulace | API klíč TypeSafe AI |
| **Automatická volba modelu** | podle náročnosti textu zvolí model zvoleného poskytovatele (Haiku / Sonnet / Opus, nebo GPT-6 Luna / Sol / Astra) | API klíč TypeSafe AI |
| **Pin do Airtable** | uloží URL a shrnutí jako záznam do tabulky | token Airtable |
| **Pin do Craft** | uloží odkaz a shrnutí jako nový dokument nebo do denní poznámky | API připojení Craft |
| **Pin do Notion** | uloží odkaz a shrnutí jako podstránku nebo záznam v databázi | token integrace Notion |

Všechny funkce kromě samotného shrnutí jsou volitelné – bez příslušného klíče se jejich
tlačítka v okně nezobrazují.

## Instalace

### Z hotového balíčku (doporučeno)

1. Na stránce [nejnovější verze](https://github.com/petrkrapek/SULWE/releases/latest) stáhněte
   v části **Assets** soubor `shrnu-to-<verze>.zip` a rozbalte ho do vlastní složky.
2. V Chromu otevřete `chrome://extensions` a vpravo nahoře zapněte **Režim pro vývojáře**.
3. Klikněte na **Načíst rozbalené** a vyberte rozbalenou složku (tu, ve které je `manifest.json`).
4. Ikonu rozšíření si připněte na lištu (ikona puzzle → špendlík).

### Ze zdrojového kódu

Stáhněte repozitář (**Code → Download ZIP**) a v kroku 3 vyberte složku `extension`.

### Aktualizace

Po stažení nové verze v `chrome://extensions` klikněte u rozšíření na ikonu obnovení
(případně ho znovu načtěte z nové složky). Nastavení i klíče zůstanou zachované.

## První spuštění

1. Klikněte na ikonu rozšíření → **Otevřít nastavení**.
2. Zvolte **poskytovatele AI** (Anthropic, OpenAI, nebo Mistral) a vložte jeho API klíč
   z [console.anthropic.com](https://console.anthropic.com/settings/keys),
   [platform.openai.com](https://platform.openai.com/api-keys), resp.
   [console.mistral.ai](https://console.mistral.ai/api-keys) (účet musí mít kredit).
3. Volitelně zvolte model, jazyk a délku shrnutí, případně vyplňte klíče pro další funkce,
   a klikněte na **Uložit**. Štítek u každé části nastavení ukazuje, jestli je připravená
   („Připraveno“, „Zapnuto“), vypnutá, nebo nedokončená.

Pak stačí na libovolné stránce kliknout na ikonu – shrnutí se začne vypisovat okamžitě.

Po instalaci se rozšíření samo otevře **uvítací stránku s návodem** – provede vás těmito kroky
a hotové sama odškrtne. Znovu ji otevřete odkazem **Návod** v záhlaví nastavení.

## Okno rozšíření

```
┌──────────────────────────────────────────┐
│ Název stránky                          ⚙ │
│ Haiku 5.5 · auto · uloženo               │  ← model a stav shrnutí
├──────────────────────────────────────────┤
│ ● Věrohodné · 87 % · manipulace žádná    │  ← výsledek ověření (po kliknutí na Ověřit)
├──────────────────────────────────────────┤
│ Shrnutí stránky…                         │  ← roluje jen tato část
│ • hlavní bod                             │
├──────────────────────────────────────────┤
│        [Ověřit] [Kopírovat] [Znovu] [Pin]│
└──────────────────────────────────────────┘
```

- **auto** – model vybrala automatická volba, **uloženo** – shrnutí je z dřívějška
  (pamatuje se do zavření prohlížeče, opakované otevření nic nestojí).
- **Znovu** vytvoří nové shrnutí, **Kopírovat** ho zkopíruje do schránky.
- **Ověřit** a **Pin** se zobrazí jen s vyplněným klíčem pro danou službu.

## Nastavení

| Volba | Možnosti |
|---|---|
| Poskytovatel AI | Anthropic (výchozí), OpenAI, nebo Mistral (+ API klíč a model zvoleného poskytovatele) |
| Model – Anthropic | Automaticky podle textu, Opus 5.5 (výchozí, nejkvalitnější), Sonnet 5.5, Haiku 5.5 (nejlevnější) |
| Model – OpenAI | Automaticky podle textu, GPT-6 Astra (výchozí, nejkvalitnější), GPT-6.1 Sol, GPT-5.6 Terra, GPT-6 Luna (nejlevnější) |
| Model – Mistral | Automaticky podle textu, Mistral Large (výchozí, největší), Mistral Medium, Mistral Small (nejlevnější) |
| Jazyk shrnutí | čeština, angličtina, jazyk stránky |
| Délka shrnutí | krátké (3–5 bodů), střední, podrobné |
| Ověření fake news | API klíč TypeSafe AI |
| Pin → Kam ukládat | Airtable, Craft, nebo Notion (+ údaje pro zvolenou službu) |

### Poskytovatel AI

Výběr funguje stejně jako cíl Pinu: zvolíte poskytovatele a nastavení zobrazí jen jeho pole
(API klíč a model). Klíč i model si každý poskytovatel pamatuje zvlášť, takže mezi nimi můžete
přepínat bez nového vyplňování. Jazyk, délka shrnutí i všechny ostatní funkce (ověření, automatická
volba modelu, Pin) fungují se všemi poskytovateli stejně.

- **Anthropic** – Claude API (`api.anthropic.com`). Když model žádost odmítne, Opus a Sonnet
  ji automaticky zkusí na záložním modelu.
- **OpenAI** – Responses API (`POST https://api.openai.com/v1/responses`) se streamováním;
  požadavky se posílají s `store: false`, takže je OpenAI neukládá pro pozdější zobrazení.
- **Mistral** – Chat Completions API (`POST https://api.mistral.ai/v1/chat/completions`)
  se streamováním. Modely se volají aliasy `mistral-large-latest`, `mistral-medium-latest`
  a `mistral-small-latest`, takže se vždy použije aktuální verze; okno ukáže skutečně použitý model.

## Ověření fake news

1. V nastavení vyplňte **API klíč TypeSafe AI** (z [console.typesafe.ai](https://console.typesafe.ai/home)).
2. V okně klikněte na **Ověřit**. Nad shrnutím se zobrazí řádek s výsledkem,
   např. `● Zavádějící · 72 % · manipulace výrazná`.

Výsledek je jedna ze čtyř kategorií – **Věrohodné**, **Názor / satira**, **Zavádějící**,
**Pravděpodobně fake news** – s pravděpodobností a mírou manipulativního jazyka.
Posuzuje ho rozhodovací model Jev (`POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`)
ze začátku textu stránky (prvních 20 000 znaků).

> Jde o automatický odhad, ne o ověření faktů člověkem. Dobře napsaný dezinformační
> text může hodnocení zkreslit.

## Automatická volba modelu

Při volbě modelu **Automaticky podle textu** nejdřív model Jev od TypeSafe AI posoudí
náročnost stránky a podle ní se vybere model zvoleného poskytovatele:

| Druh textu | Anthropic | OpenAI | Mistral |
|---|---|---|---|
| Běžná zpráva, blog, oznámení, jednoduchý text | Haiku 5.5 | GPT-6 Luna | Mistral Small |
| Odbornější článek, analýza, návod, recenze | Sonnet 5.5 | GPT-6.1 Sol | Mistral Medium |
| Náročný, vysoce odborný text (studie, právo, medicína, technika) | Opus 5.5 | GPT-6 Astra | Mistral Large |

Vyžaduje klíč TypeSafe AI. Bez něj, nebo když posouzení selže, se použije střední model
(Sonnet 5.5, GPT-6.1 Sol, resp. Mistral Medium) a okno na to upozorní.

## Pin

Tlačítko **Pin** (dostupné po dokončení shrnutí) uloží odkaz na stránku a její shrnutí.
Cíl zvolíte v nastavení v části **Pin → Kam ukládat**. Stav „Připnuto ✓“ se pamatuje
zvlášť pro každý cíl, takže stejnou stránku můžete uložit do Airtable, Craft i Notion.

### Pin do Craft

V části **Jak ukládat** zvolte režim podle typu připojení v Craft:

| Režim | Typ připojení v Craft | Výsledek |
|---|---|---|
| **Nový dokument** (výchozí) | ke všem dokumentům | samostatný dokument pojmenovaný podle stránky, mezi nezařazenými (Unsorted) |
| **Denní poznámka** | Daily Notes & Tasks | podstránka na konci dnešního denního zápisu (Daily Note) |

Obojí obsahuje odkaz na stránku, shrnutí a čas uložení.

1. V aplikaci [Craft](https://www.craft.do) otevřete **Imagine → API** (Connections) a přidejte
   API připojení odpovídajícího typu s povoleným zápisem.
2. V detailu připojení vytvořte **API klíč** (`pdk_…`) – Craft ho ukáže jen jednou.
3. Do nastavení rozšíření vložte adresu připojení (`https://connect.craft.do/links/…/api/v1`;
   stačí i adresa jeho dokumentace `…/link/…/docs/v1`), API klíč a zvolte režim.

> Každý typ připojení má v Craft vlastní adresu i klíč – při změně režimu je přepište.

### Pin do Airtable

1. Na [airtable.com/create/tokens](https://airtable.com/create/tokens) vytvořte osobní přístupový token
   s oprávněními `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`
   a přidejte mu přístup ke své databázi (případně k pracovnímu prostoru).
2. V nastavení vyplňte token a **databázi** – ID `app…` nebo rovnou adresu databáze
   z prohlížeče. Pokud databázi ještě nemáte, vložte ID pracovního prostoru `wsp…` a rozšíření
   při prvním Pinu založí databázi „Shrnutí stránek“ a její ID si zapamatuje.
3. Volitelně změňte název tabulky (výchozí „Shrnutí stránek“).

Chování:
- Chybějící tabulka se založí se sloupci **URL**, **Shrnutí** a **Datum a čas**. Datum a čas
  je systémový sloupec *Created time*, který Airtable vyplní sám (pokud by ho API odmítlo
  vytvořit, založí se obyčejné datum a čas doplní rozšíření).
- Do existující tabulky se jen přidávají nové záznamy; chybějící sloupce se doplní,
  nic se nemaže ani nepřepisuje.
- Stejná adresa se uloží jen jednou.
- Ukládá se celá adresa stránky včetně parametrů, aby odkaz fungoval.

### Pin do Notion

1. Na [notion.so/profile/integrations](https://www.notion.so/profile/integrations) vytvořte
   **interní integraci** se schopnostmi čtení, vkládání a úprav obsahu a zkopírujte její token (`ntn_…`).
2. V Notion otevřete cílovou stránku nebo databázi a sdílejte ji s integrací:
   **••• → Připojení** → vyberte svou integraci.
3. Do nastavení rozšíření vložte token a odkaz na stránku či databázi (**••• → Kopírovat odkaz**),
   případně jen její ID.

| Cíl | Výsledek |
|---|---|
| **Stránka** | podstránka pojmenovaná podle webu s odkazem, shrnutím a časem uložení |
| **Databáze** | nový záznam: název webu v hlavním sloupci, adresa ve sloupci typu URL, shrnutí v obsahu záznamu |

Chování u databáze:
- Stejná adresa se uloží jen jednou (porovnává se sloupec typu URL, přednostně pojmenovaný **URL**).
- Když databáze sloupec typu URL nemá, rozšíření doplní sloupec **URL**; jinak nic nemaže
  ani nepřepisuje.
- Čas uložení se ukazuje v obsahu záznamu; pokud ho chcete i ve sloupci, přidejte do databáze
  sloupec *Created time* – Notion ho vyplní sám.

Používá se Notion API verze `2026-03-11` (`api.notion.com`).

## Řešení potíží

| Hláška / situace | Příčina a řešení |
|---|---|
| „Tuto stránku nelze přečíst“ | Interní stránky Chromu (`chrome://…`), Chrome Web Store a vestavěný prohlížeč PDF rozšířením číst obsah nedovolí. |
| „API klíč je neplatný“ / „nejsou kredity“ | Zkontrolujte klíč a kredit na [console.anthropic.com](https://console.anthropic.com). |
| „API klíč OpenAI je neplatný“ / „Na účtu OpenAI nejsou kredity“ | Zkontrolujte klíč a kredit (Billing) na [platform.openai.com](https://platform.openai.com). |
| „API klíč Mistral je neplatný“ / „Na účtu Mistral nejsou kredity“ | Zkontrolujte klíč a platební údaje (Billing) na [console.mistral.ai](https://console.mistral.ai). |
| „Pro automatickou volbu modelu chybí klíč TypeSafe AI“ | Doplňte klíč TypeSafe, nebo zvolte konkrétní model. |
| Craft: „Cílový dokument je v Craft v koši“ | Dnešní denní poznámka je v koši – obnovte ji, nebo ji z koše trvale smažte. |
| Craft: „vyžaduje API klíč“ | Vyplňte API klíč připojení (`pdk_…`). |
| Airtable: „nemá potřebná oprávnění“ | Tokenu chybí některé ze čtyř oprávnění nebo přístup k databázi. |
| Notion: „nebyla nalezena“ | Stránka nebo databáze není sdílená s integrací (••• → Připojení), nebo je v nastavení špatný odkaz. |
| Notion: „nemá potřebná oprávnění“ | Integraci chybí schopnost čtení, vkládání nebo úprav obsahu. |

## Soukromí a bezpečnost

- Stránku rozšíření přečte jen po kliknutí na ikonu, jen tu jednu (oprávnění `activeTab`).
- Text stránky se posílá pouze do zvolených služeb: Anthropic, OpenAI, nebo Mistral (shrnutí – jen
  zvolenému poskytovateli), TypeSafe AI (ověření, volba modelu), Airtable, Craft nebo Notion (Pin). Žádný vlastní server, žádné sledování.
- Do AI služeb se adresa stránky posílá bez parametrů a kotvy (`?…`, `#…`), protože v nich
  mohou být přihlašovací tokeny nebo osobní údaje.
- API klíče jsou uložené jen lokálně v prohlížeči (`chrome.storage.local`) a každý se posílá
  pouze na adresu své služby: `api.anthropic.com`, `api.openai.com`, `api.mistral.ai`, `api.typesafe.ai`,
  `api.airtable.com`, `connect.craft.do`, `api.notion.com`.
- Stránky rozšíření mají přísnou Content Security Policy: smějí spouštět jen vlastní skripty
  a připojovat se jen k těmto sedmi API.
- Doporučujeme nastavit v konzolích jednotlivých služeb měsíční limit útraty.

Podrobnosti o zpracování údajů jsou v [zásadách ochrany osobních údajů](PODMINKY.md).

## Náklady

Rozšíření je zdarma; za použití AI platíte přímo poskytovatelům podle spotřeby. Cenu shrnutí
nejvíc ovlivňuje model – Haiku 5.5 je výrazně levnější než Opus 5.5 (u OpenAI obdobně
GPT-6 Luna oproti GPT-6 Astra, u Mistral Small oproti Large). Automatická volba modelu přidá ke každému shrnutí jedno volání
TypeSafe AI, u běžných textů ale díky nejlevnějšímu modelu obvykle ušetří.

## Vydání nové verze

Hotové verze jsou na stránce [Releases](https://github.com/petrkrapek/SULWE/releases) a vytváří je
automaticky GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml)).

1. Zvyšte `version` v `extension/manifest.json`.
2. V [CHANGELOG.md](CHANGELOG.md) přejmenujte oddíl **[Unreleased]** na číslo nové verze s datem
   (a doplňte odkaz na porovnání verzí na konci souboru).
3. Změny nahrajte do `master` (sloučením pull requestu). Workflow ověří verzi, spustí testy,
   sestaví ZIP, vezme poznámky z CHANGELOG.md a založí release se značkou `vX.Y.Z`
   a přiloženým balíčkem. Pokud release pro danou verzi už existuje, nic nedělá.
4. ZIP z release nahrajte do [Chrome Web Store Developer Dashboardu](https://chrome.google.com/webstore/devconsole).

Do Chrome Web Store se nahrává **jen ZIP s obsahem složky `extension`** (`manifest.json` v kořeni
archivu), ne celý repozitář. Lokálně ho vytvoříte příkazem `npm run zip`.

> Release vzniká jen z větve `master` – změna verze v pracovní větvi release nezaloží.
> Release lze vyvolat i ručním nahráním značky (`git tag v0.5.6 && git push origin v0.5.6`)
> – značka musí odpovídat verzi v `manifest.json` a měla by ukazovat na commit v `master`.
>
> Jediným zdrojem čísla verze je `extension/manifest.json`; `package.json` verzi nemá.

## Vývoj

Zdrojové kódy jsou ve složce `src/`, do `extension/dist/` se sestavují pomocí esbuild
(sestavené soubory jsou v repozitáři, aby šlo rozšíření načíst bez sestavování).

Potřebujete Node.js 22 nebo novější (verze je v `.nvmrc`).

```bash
npm install
npm run build    # jednorázové sestavení
npm run watch    # průběžné sestavování při změnách
npm run zip      # sestavení + balíček do release/ (lokálně, není v gitu)

npm run lint     # ESLint
npm run format   # Prettier (JavaScript a konfigurace)
npm test         # unit testy (node --test, složka test/)
npm run check    # vše výše + sestavení – stejné kontroly jako CI
```

Po sestavení v `chrome://extensions` klikněte u rozšíření na ikonu obnovení.

Každý pull request kontroluje GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):
lint, formátování, testy a to, že commitnutý `extension/dist/` odpovídá zdrojům v `src/`.
Pokud kontrola sestavení selže, spusťte `npm run build` a změny v `extension/dist/` commitněte.
Závislosti a GitHub Actions hlídá Dependabot ([`.github/dependabot.yml`](.github/dependabot.yml)).

```
extension/            ← tuto složku načítáte do Chromu
  manifest.json
  popup.html/.css     ← okno se shrnutím
  options.html/.css   ← nastavení
  welcome.html/.css   ← uvítací stránka s návodem (otevře se po instalaci)
  style.css           ← sdílené barvy a styly (světlý i tmavý režim)
  dist/               ← sestavený JavaScript
  icons/
src/
  popup.js            ← logika okna (čtení stránky, shrnutí, ověření, Pin)
  summarize.js        ← prompt a volání zvoleného poskytovatele (Claude API)
  openai.js           ← shrnutí přes OpenAI (Responses API, streamování)
  mistral.js          ← shrnutí přes Mistral (Chat Completions API, streamování)
  sse.js              ← čtení streamované odpovědi (OpenAI, Mistral)
  factcheck.js        ← TypeSafe AI (Jev): ověření fake news a automatická volba modelu
  airtable.js         ← Pin do Airtable
  craft.js            ← Pin do Craft (nový dokument / denní poznámka)
  notion.js           ← Pin do Notion (podstránka / záznam v databázi)
  markdown.js         ← bezpečné vykreslení Markdownu (bez innerHTML)
  page.js             ← očištění dat stránky před odesláním do AI
  settings.js         ← nastavení a jejich výchozí hodnoty
  options.js          ← stránka nastavení
  welcome.js          ← uvítací stránka (odškrtávání hotových kroků)
  background.js       ← service worker: po instalaci otevře uvítací stránku
test/                 ← unit testy (node --test)
scripts/zip.mjs       ← tvorba balíčku pro Chrome Web Store
.github/workflows/    ← CI (kontrola PR) a automatické vytvoření GitHub Release
CHANGELOG.md          ← historie změn
```

## Licence

Projekt je licencován pod [Apache License 2.0](LICENSE). Copyright 2026 Petr Křápek
(viz [NOTICE](NOTICE)).
