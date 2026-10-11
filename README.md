# Shrnutí stránky – rozšíření do Google Chrome

Rozšíření, které jedním kliknutím shrne právě otevřenou webovou stránku pomocí AI
a zobrazí shrnutí v malém okně. Volitelně odhadne věrohodnost stránky, samo vybere
vhodný model podle náročnosti textu a uloží odkaz se shrnutím do Airtable nebo Craft.

**Aktuální verze:** 0.5.3 · historie změn v [CHANGELOG.md](CHANGELOG.md)

## Funkce

| Funkce | Popis | Potřebujete |
|---|---|---|
| **Shrnutí stránky** | průběžně vypisované shrnutí v okně rozšíření; kopírování, opětovné vytvoření | API klíč Anthropic |
| **Ověření fake news** | tlačítko *Ověřit* odhadne věrohodnost stránky a míru manipulace | API klíč TypeSafe AI |
| **Automatická volba modelu** | podle náročnosti textu zvolí Haiku 5.5, Sonnet 5.5 nebo Opus 5.5 | API klíč TypeSafe AI |
| **Pin do Airtable** | uloží URL a shrnutí jako záznam do tabulky | token Airtable |
| **Pin do Craft** | uloží odkaz a shrnutí jako nový dokument nebo do denní poznámky | API připojení Craft |

Všechny funkce kromě samotného shrnutí jsou volitelné – bez příslušného klíče se jejich
tlačítka v okně nezobrazují.

## Instalace

### Z hotového balíčku (doporučeno)

1. Stáhněte nejnovější ZIP ze stránky [Releases](https://github.com/petrkrapek/SULWE/releases)
   (nebo ze složky [`release/`](release/)), např. `shrnuti-stranky-0.5.3.zip`, a rozbalte ho do vlastní složky.
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
2. Vložte API klíč z [console.anthropic.com](https://console.anthropic.com/settings/keys)
   (účet musí mít kredit).
3. Volitelně zvolte model, jazyk a délku shrnutí, případně vyplňte klíče pro další funkce,
   a klikněte na **Uložit**.

Pak stačí na libovolné stránce kliknout na ikonu – shrnutí se začne vypisovat okamžitě.

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
| Model | Automaticky podle textu, Opus 5.5 (výchozí, nejkvalitnější), Sonnet 5.5, Haiku 5.5 (nejlevnější) |
| Jazyk shrnutí | čeština, angličtina, jazyk stránky |
| Délka shrnutí | krátké (3–5 bodů), střední, podrobné |
| Ověření fake news | API klíč TypeSafe AI |
| Pin → Kam ukládat | Airtable, nebo Craft (+ údaje pro zvolenou službu) |

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
náročnost stránky a podle ní se vybere model:

| Druh textu | Model |
|---|---|
| Běžná zpráva, blog, oznámení, jednoduchý text | Haiku 5.5 |
| Odbornější článek, analýza, návod, recenze | Sonnet 5.5 |
| Náročný, vysoce odborný text (studie, právo, medicína, technika) | Opus 5.5 |

Vyžaduje klíč TypeSafe AI. Bez něj, nebo když posouzení selže, se použije Sonnet 5.5
a okno na to upozorní.

## Pin

Tlačítko **Pin** (dostupné po dokončení shrnutí) uloží odkaz na stránku a její shrnutí.
Cíl zvolíte v nastavení v části **Pin → Kam ukládat**. Stav „Připnuto ✓“ se pamatuje
zvlášť pro každý cíl, takže stejnou stránku můžete uložit do Airtable i do Craft.

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

## Řešení potíží

| Hláška / situace | Příčina a řešení |
|---|---|
| „Tuto stránku nelze přečíst“ | Interní stránky Chromu (`chrome://…`), Chrome Web Store a vestavěný prohlížeč PDF rozšířením číst obsah nedovolí. |
| „API klíč je neplatný“ / „nejsou kredity“ | Zkontrolujte klíč a kredit na [console.anthropic.com](https://console.anthropic.com). |
| „Pro automatickou volbu modelu chybí klíč TypeSafe AI“ | Doplňte klíč TypeSafe, nebo zvolte konkrétní model. |
| Craft: „Cílový dokument je v Craft v koši“ | Dnešní denní poznámka je v koši – obnovte ji, nebo ji z koše trvale smažte. |
| Craft: „vyžaduje API klíč“ | Vyplňte API klíč připojení (`pdk_…`). |
| Airtable: „nemá potřebná oprávnění“ | Tokenu chybí některé ze čtyř oprávnění nebo přístup k databázi. |

## Soukromí a bezpečnost

- Stránku rozšíření přečte jen po kliknutí na ikonu, jen tu jednu (oprávnění `activeTab`).
- Text stránky se posílá pouze do zvolených služeb: Anthropic (shrnutí), TypeSafe AI (ověření,
  volba modelu), Airtable nebo Craft (Pin). Žádný vlastní server, žádné sledování.
- Do AI služeb se adresa stránky posílá bez parametrů a kotvy (`?…`, `#…`), protože v nich
  mohou být přihlašovací tokeny nebo osobní údaje.
- API klíče jsou uložené jen lokálně v prohlížeči (`chrome.storage.local`) a každý se posílá
  pouze na adresu své služby: `api.anthropic.com`, `api.typesafe.ai`, `api.airtable.com`,
  `connect.craft.do`.
- Stránky rozšíření mají přísnou Content Security Policy: smějí spouštět jen vlastní skripty
  a připojovat se jen k těmto čtyřem API.
- Doporučujeme nastavit v konzolích jednotlivých služeb měsíční limit útraty.

## Náklady

Rozšíření je zdarma; za použití AI platíte přímo poskytovatelům podle spotřeby. Cenu shrnutí
nejvíc ovlivňuje model – Haiku 5.5 je výrazně levnější než Opus 5.5. Automatická volba
modelu přidá ke každému shrnutí jedno volání TypeSafe AI, u běžných textů ale díky Haiku
obvykle ušetří.

## Nahrání do Chrome Web Store

Do Developer Dashboardu se nahrává **jen ZIP s obsahem složky `extension`**, ne celý repozitář
(soubor `manifest.json` musí být v kořeni archivu). Hotový balíček je ve složce `release/`.
Nový vytvoříte příkazem:

```bash
npm run zip      # sestaví kód a vytvoří release/shrnuti-stranky-<verze>.zip
```

Před každým dalším nahráním zvyšte `version` v `extension/manifest.json` a doplňte
[CHANGELOG.md](CHANGELOG.md).

## Vydání nové verze (GitHub Release)

Hotové verze jsou ke stažení na stránce [Releases](https://github.com/petrkrapek/SULWE/releases).
Release vytváří automaticky GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml))
po nahrání značky s číslem verze:

```bash
git tag v0.5.3
git push origin v0.5.3
```

Workflow ověří, že značka odpovídá verzi v `manifest.json`, sestaví ZIP, vezme poznámky
z příslušného oddílu CHANGELOG.md a release založí i s přiloženým balíčkem.

## Vývoj

Zdrojové kódy jsou ve složce `src/`, do `extension/dist/` se sestavují pomocí esbuild
(sestavené soubory jsou v repozitáři, aby šlo rozšíření načíst bez sestavování).

```bash
npm install
npm run build    # jednorázové sestavení
npm run watch    # průběžné sestavování při změnách
npm run zip      # sestavení + balíček do release/
```

Po sestavení v `chrome://extensions` klikněte u rozšíření na ikonu obnovení.

```
extension/            ← tuto složku načítáte do Chromu
  manifest.json
  popup.html/.css     ← okno se shrnutím
  options.html        ← nastavení
  style.css           ← sdílené barvy a styly (světlý i tmavý režim)
  dist/               ← sestavený JavaScript
  icons/
src/
  popup.js            ← logika okna (čtení stránky, shrnutí, ověření, Pin)
  summarize.js        ← volání Claude API a prompt
  factcheck.js        ← TypeSafe AI (Jev): ověření fake news a automatická volba modelu
  airtable.js         ← Pin do Airtable
  craft.js            ← Pin do Craft (nový dokument / denní poznámka)
  markdown.js         ← bezpečné vykreslení Markdownu (bez innerHTML)
  page.js             ← očištění dat stránky před odesláním do AI
  settings.js         ← nastavení a jejich výchozí hodnoty
  options.js          ← stránka nastavení
scripts/zip.mjs       ← tvorba balíčku pro Chrome Web Store
release/              ← hotové balíčky ZIP
.github/workflows/    ← automatické vytvoření GitHub Release
CHANGELOG.md          ← historie změn
```
