Zásady ochrany osobních údajů – Shrnutí stránky

Poslední aktualizace: 10. října 2026

Tyto zásady popisují zpracování údajů při používání rozšíření Shrnutí stránky. Rozšíření vytváří shrnutí aktuální webové stránky pomocí služby Anthropic a volitelně umožňuje posoudit věrohodnost jejího obsahu pomocí TypeSafe AI.

1. Jaké údaje rozšíření zpracovává

Po aktivaci rozšíření uživatelem načte název, URL a viditelný text aktuální webové stránky. Tyto údaje slouží k vytvoření shrnutí nebo k volitelnému posouzení věrohodnosti.

Obsah stránky může zahrnovat osobní či důvěrné údaje, pokud jsou na ní zobrazeny. Rozšíření proto používejte pouze na stránkách, jejichž obsah můžete předat příslušné AI službě.

Rozšíření dále zpracovává API klíče zadané uživatelem a nastavení modelu, jazyka a délky shrnutí.

2. Předávání údajů externím službám

Pro vytvoření shrnutí se text, název a URL stránky odesílají službě Anthropic prostřednictvím api.anthropic.com. Požadavek obsahuje také vybrané nastavení shrnutí a API klíč Anthropic potřebný k jeho autorizaci.

Pokud uživatel zadá API klíč TypeSafe AI a klikne na tlačítko Ověřit, údaje o stránce se odesílají také službě TypeSafe AI prostřednictvím api.typesafe.ai za účelem posouzení věrohodnosti obsahu. API klíč TypeSafe AI se používá k autorizaci tohoto požadavku.

Každý API klíč se odesílá pouze službě, ke které náleží. Požadavky jsou přenášeny prostřednictvím HTTPS.

Zpracování a uchovávání údajů u těchto poskytovatelů se řídí jejich vlastními podmínkami a zásadami ochrany osobních údajů. Tyto zásady rozšíření neurčují dobu uchovávání ani další nakládání s údaji na straně poskytovatelů.

3. Ukládání v prohlížeči

API klíče a uživatelská nastavení jsou uloženy v místním úložišti rozšíření v prohlížeči. Rozšíření pro ně nepoužívá synchronizované úložiště Chrome.

Vytvořená shrnutí a výsledky posouzení věrohodnosti jsou dočasně ukládány v úložišti relace prohlížeče a přiřazeny k URL příslušné stránky. To umožňuje jejich opětovné zobrazení bez zbytečného opakování API požadavků.

4. Rozsah přístupu a účel použití

Rozšíření získává přístup k aktuální stránce po aktivaci uživatelem. Nesleduje průběžně historii prohlížení a nevyužívá analytické ani reklamní sledovací nástroje.

Zpracovávané údaje slouží k poskytování funkcí rozšíření. Autor rozšíření je neprodává ani je prostřednictvím rozšíření neposílá na vlastní server.

5. Kontrola a odstranění údajů

API klíče můžete odstranit v nastavení rozšíření vymazáním příslušných polí a uložením změn. Klíč lze také zneplatnit přímo u jeho poskytovatele.

Odinstalováním rozšíření se odstraní jeho místně uložené údaje z daného profilu prohlížeče. Odstranění místních údajů neodstraňuje údaje již předané externím službám. Požadavky týkající se těchto údajů je potřeba řešit s příslušným poskytovatelem.

6. Změny těchto zásad

Tyto zásady mohou být aktualizovány při změně funkcí rozšíření nebo způsobu zpracování údajů. Datum poslední aktualizace je uvedeno na začátku dokumentu.
