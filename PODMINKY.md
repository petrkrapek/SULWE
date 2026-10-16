Zásady ochrany osobních údajů – Shrnu.to

Poslední aktualizace: 16. října 2026

Tyto zásady popisují zpracování údajů při používání rozšíření Shrnu.to – shrnutí stránky (dále „Shrnu.to“). Rozšíření vytváří shrnutí aktuální webové stránky pomocí služby Anthropic, OpenAI, nebo Mistral AI – podle poskytovatele zvoleného v nastavení. Volitelně umožňuje posoudit věrohodnost obsahu stránky a automaticky zvolit model pomocí TypeSafe AI a uložit odkaz se shrnutím do služby Airtable, Craft nebo Notion.

1. Jaké údaje rozšíření zpracovává

Po aktivaci rozšíření uživatelem načte název, URL a viditelný text aktuální webové stránky. Tyto údaje slouží k vytvoření shrnutí, k volitelnému posouzení věrohodnosti, k volitelné automatické volbě modelu a k volitelnému uložení odkazu se shrnutím (Pin).

Obsah stránky může zahrnovat osobní či důvěrné údaje, pokud jsou na ní zobrazeny. Rozšíření proto používejte pouze na stránkách, jejichž obsah můžete předat příslušným službám.

Rozšíření dále zpracovává API klíče a přístupové údaje zadané uživatelem (Anthropic, OpenAI, Mistral AI, TypeSafe AI, Airtable, Craft, Notion) a nastavení poskytovatele AI, modelu, jazyka, délky shrnutí a cíle Pinu.

2. Předávání údajů externím službám

Pro vytvoření shrnutí se text, název a URL stránky odesílají pouze zvolenému poskytovateli AI: službě Anthropic prostřednictvím api.anthropic.com, službě OpenAI prostřednictvím api.openai.com, nebo službě Mistral AI prostřednictvím api.mistral.ai. URL se odesílá bez parametrů a kotvy (části za znaky „?“ a „#“). Požadavek obsahuje také vybrané nastavení shrnutí a API klíč zvoleného poskytovatele potřebný k jeho autorizaci. Požadavky na OpenAI se odesílají s volbou, aby je služba neukládala pro pozdější zobrazení (store: false); jejich případné uchovávání na straně OpenAI se řídí jejími podmínkami. Uchovávání požadavků na straně Mistral AI se řídí podmínkami Mistral AI.

Pokud uživatel zadá API klíč TypeSafe AI, odesílají se název stránky, URL bez parametrů a kotvy a začátek textu stránky (nejvýše 20 000 znaků) také službě TypeSafe AI prostřednictvím api.typesafe.ai, a to:
- po kliknutí na tlačítko Ověřit – za účelem posouzení věrohodnosti obsahu;
- při každém novém shrnutí, pokud je v nastavení zvolen model „Automaticky podle textu“ – za účelem posouzení náročnosti textu a výběru modelu.
API klíč TypeSafe AI se používá k autorizaci těchto požadavků.

Pokud uživatel nastaví Pin do Airtable a klikne na tlačítko Pin, odesílá se úplná URL stránky (včetně parametrů, aby uložený odkaz fungoval) a vytvořené shrnutí službě Airtable prostřednictvím api.airtable.com a ukládají se jako záznam do databáze uživatele. Rozšíření může v databázi založit tabulku nebo sloupce, případně celou databázi v pracovním prostoru uživatele; existující záznamy nemění ani nemaže.

Pokud uživatel nastaví Pin do Craft a klikne na tlačítko Pin, odesílá se název stránky, úplná URL stránky (včetně parametrů), vytvořené shrnutí a čas uložení službě Craft prostřednictvím connect.craft.do a ukládají se jako nový dokument nebo jako podstránka denní poznámky uživatele.

Pokud uživatel nastaví Pin do Notion a klikne na tlačítko Pin, odesílá se název stránky, úplná URL stránky (včetně parametrů), vytvořené shrnutí a čas uložení službě Notion prostřednictvím api.notion.com a ukládají se jako podstránka zvolené stránky nebo jako záznam ve zvolené databázi uživatele. Rozšíření může do databáze přidat sloupec URL; existující záznamy nemění ani nemaže. Ke kontrole, zda už stránka v databázi uložená je, rozšíření v databázi vyhledá záznam se stejnou URL.

Každý API klíč se odesílá pouze službě, ke které náleží. Požadavky jsou přenášeny prostřednictvím HTTPS.

Zpracování a uchovávání údajů u těchto poskytovatelů se řídí jejich vlastními podmínkami a zásadami ochrany osobních údajů. Tyto zásady rozšíření neurčují dobu uchovávání ani další nakládání s údaji na straně poskytovatelů.

3. Ukládání v prohlížeči

API klíče a uživatelská nastavení jsou uloženy v místním úložišti rozšíření v prohlížeči. Rozšíření pro ně nepoužívá synchronizované úložiště Chrome.

Vytvořená shrnutí, výsledky posouzení věrohodnosti a informace o tom, zda už byla stránka uložena Pinem, jsou dočasně ukládány v úložišti relace prohlížeče a přiřazeny k URL příslušné stránky. To umožňuje jejich opětovné zobrazení bez zbytečného opakování API požadavků. Úložiště relace se vymaže při zavření prohlížeče nebo při uložení nastavení.

4. Rozsah přístupu a účel použití

Rozšíření získává přístup k aktuální stránce po aktivaci uživatelem. Nesleduje průběžně historii prohlížení a nevyužívá analytické ani reklamní sledovací nástroje.

Zpracovávané údaje slouží k poskytování funkcí rozšíření. Autor rozšíření je neprodává ani je prostřednictvím rozšíření neposílá na vlastní server.

5. Kontrola a odstranění údajů

API klíče a přístupové údaje můžete odstranit v nastavení rozšíření vymazáním příslušných polí a uložením změn. Klíč lze také zneplatnit přímo u jeho poskytovatele.

Odinstalováním rozšíření se odstraní jeho místně uložené údaje z daného profilu prohlížeče. Odstranění místních údajů neodstraňuje údaje již předané externím službám. Požadavky týkající se těchto údajů je potřeba řešit s příslušným poskytovatelem.

6. Změny těchto zásad

Tyto zásady mohou být aktualizovány při změně funkcí rozšíření nebo způsobu zpracování údajů. Datum poslední aktualizace je uvedeno na začátku dokumentu.
