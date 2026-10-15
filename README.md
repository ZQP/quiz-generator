# ZQP Quiz Generator

Ein Windows-Desktop-Werkzeug zur KI-gestützten Erstellung barrierearmer HTML5-Quizze für das Webportal der Stiftung ZQP ([zqp.de](https://www.zqp.de)).

## Kernfunktionen

- **KI-Generierung (Gemini API)**: Formulierung eines Prompts / Quizthemas, automatische Erstellung von Quizfragen mit Erklärungen und Feedback.
- **ZQP Corporate Design**: Automatische Ausrichtung an Typografie (Inter), Farbwelten (ZQP-Petrol `#247a6d`, Sand/Hellgrau, Signalrot) und Komponenten-Layouts von zqp.de.
- **Barrierearmut (BITV 2.0 / WCAG 2.1 AA)**: Semantisches HTML, vollständige Tastatur-Bedienbarkeit, ARIA-Live-Regionen für Screenreader und starke Kontraste.
- **Interaktive Live-Vorschau**: Direktes Testen im eingebetteten Player (Desktop & Mobile Viewport).
- **Getrennte Code-Ausgabe**: Saubere Trennung in drei Segmente:
  - HTML (semantisches Gerüst)
  - CSS (Tailwind CSS-Klassen oder spezifische Ergänzungsstile)
  - JavaScript (barrierefreie Interaktionslogik)
- **Bibliotheks-Statusanzeige**: Klare Kennzeichnung, ob für das Quiz Tailwind CSS und/oder Font Awesome auf der Webseite zugeschaltet werden müssen.

## Neu in v0.3.5 (Interaktiver Auswahldialog für Lernstationen & WYSIWYG-Erweiterung)

- **Zentrierter Auswahldialog für neue Lernstationen**:
  - Behoben: Beim Klick auf den Button zum Hinzufügen einer Station passierte bisher nichts, da das Dropdown-Menü durch die scrollbare Navigationsleiste vertikal abgeschnitten wurde (`overflow-x-auto` führte zu vertikalem Clipping).
  - Das Menü wurde durch ein vollwertiges modales Fenster (`z-60`) ersetzt, das alle 10 didaktischen ZQP-Spielformate übersichtlich mit Icon, Titel, Didaktik-Badge, Kernaussage und Kurzbeschreibung präsentiert.
- **Ergonomische Button-Beschriftung & Zweiter Einstiegspunkt**:
  - Doppeltes Plus-Symbol (`+ + Station`) in der Navigationsleiste entfernt und sauber beschriftet (`[+ Station hinzufügen]`).
  - Zusätzlicher Schnellzugriff `[+ Neue Station]` direkt in der Bearbeitungs-Toolbar neben „Duplizieren“ und „Löschen“.
- **WYSIWYG-Editor für alle 10 Spielformate komplettiert**:
  - Vollständige Formulare zur Bearbeitung von *Situationsvergleich (A vs. B)* und *Lückentext* im Stations-Editor integriert.

## Neu in v0.3.4 (Stabilität, White-Screen-Fix & Error Boundary)

- **Behebung des White-Screen-Absturzes beim Öffnen der Einstellungen**:
  - React „Rule of Hooks“-Verletzung in `SettingsModal.tsx` behoben (Hooks für Standard-Textbausteine und Ergebnis-Station wurden vor dem bedingten Abbruch platziert).
  - Sauberes bedingtes Mounten des Modals in `App.tsx` (`{isSettingsOpen && <SettingsModal ... />}`) verhindert fehlerhafte Hook-Zyklen.
- **Integrierte React-Error-Boundary (Fehler-Schutzschirm)**:
  - Fängt unvorhergesehene Rendering-Fehler in allen Komponenten zentral ab.
  - Verhindert das unkontrollierte Erscheinen eines weißen Bildschirms und bietet stattdessen ein benutzerfreundliches ZQP-Wiederherstellungsfenster mit Fehlerdiagnose, „Neu laden“- und „Cache leeren“-Möglichkeit.

## Neu in v0.3.3 (UI-Feinschliff, Tooltip-Didaktik & Ergebnis-Lesbarkeit)

- **Schickes Pool-Status-Badge**: Die sperrige weiße Beschriftung in der Kopfzeile der Spielmechaniken wurde durch ein dezentes, elegantes ZQP-Petrol-Badge (`● Alle 10 aktiv` bzw. `● X von 10 aktiv`) mit Statusindikator ersetzt.
- **Didaktische Hover-Tooltips für alle 10 Quiz-Formate**:
  - Jeder Spielmechanik-Chip verfügt nun über einen schnellen, modernen ZQP-Tooltip mit Pfeil.
  - Zeigt Formatkategorie, pädagogische Kernaussage, didaktischen Einsatzzweck, konkrete ZQP-Praxisbeispiele und die genaue Interaktionsmechanik.
  - Dynamische Viewport-Positionierung verhindert Abschneiden an Bildschirmecken.
- **Fehlerbehebung Stations-Editor & Synchronisation**:
  - Behoben: Beim Öffnen des Stations-Editors nach Neuerstellung eines Quiz wurde nicht mehr das alte Musterquiz geladen, sondern verlässlich das aktuell aktive Quiz synchronisiert.
  - Das Editor-Modal wird nur noch bei tatsächlichem Öffnen gemountet und synchronisiert sich via `useEffect`.
- **Bereinigte Editor-Navigationsleiste (Keine Überlappungen mehr)**:
  - Scrollbare Stations-Tabs sind nun in einem isolierten Container gekapselt, der nicht mehr mit der Steuerung kollidiert.
  - Redundante doppelte Text-Badges am rechten Rand entfernt und dezente ZQP-Scrollbar integriert.
- **Verbesserte Lesbarkeit auf der Ergebnis-Station**:
  - Die gelösten/ungelösten Aufgaben werden nicht mehr in zwei schmalen, abgeschnittenen Spalten dargestellt, sondern übersichtlich vollflächig untereinander in Zeilen mit vollständigem Aufgabentitel und Format-Icon.

## Neu in v0.3.2 (Anpassbare Textbausteine, UI-Labels & Editierbare Ergebnis-Station)

- **Vollständig anpassbare Textbausteine & Micro-Copy**:
  - Sämtliche Schaltflächen- und Feedback-Texte im Drawer („Ansicht ansehen“, „Warum richtig / Warum falsch:“, „ZQP-Praxiswissen:“, „Nächste Station“, „Zur Gesamtauswertung“, „Praxistest wiederholen“) können nun nach Belieben angepasst werden.
  - Sortierstationen (Bucket Sort) verfügen über konfigurierbare Kategorietitel und Zuweisungs-Buttons („Do ✓“ / „Don't ✕“ bzw. individualisierbar wie z. B. „Empfohlen“ / „Vermeiden“ oder themenspezifische Labels), sowohl quizweit als auch pro Station überschreibbar.
- **Editierbare Ergebnis-Station (Auswertungs-Screen)**:
  - Titel, Untertitel und Punktestand-Texte (100 %, ab 70 %, unter 70 % sowie 0 %) sind frei editierbar.
  - Der starre Verweis auf „ZQP-Leitlinien“ bei 0 % gelösten Aufgaben wurde durch neutrale, frei konfigurierbare Formulierungen ersetzt.
  - Dynamische Platzhalter wie `{total}`, `{solved}` und `{percent}` werden in der Vorschau und im exportierten HTML automatisch berechnet und eingesetzt.
  - In der Vorschau kann die Ergebnis-Station nun direkt über die obere Toolbar („Ergebnis bearbeiten“) geöffnet und editiert werden.
- **Globale Standardwerte in den Einstellungen**:
  - Neuer Einstellungs-Tab *„Standard-Textbausteine“*: Einmal global im ZQP Quiz-Generator hinterlegt, dienen die gewünschten Formulierungen als Standard für alle künftigen Quiz-Generierungen.
- **Export-Compiler-Synchronisation**:
  - Der eigenständige HTML/CSS/JS-Compiler injiziert sämtliche Labels und Ergebnis-Konfigurationen direkt in den barrierefreien Standalone-Player.

## Neu in v0.3.1 (Studio-Modus & Station-Editor Live-Drawer)

- **Station-Editor als Live-Drawer (Vorschlag B)**: Der WYSIWYG-Stationseditor öffnet sich nun standardmäßig als eleganter Schiebe-Drawer von der rechten Seite. Die interaktive Quiz-Vorschau bleibt im Hintergrund sichtbar und orientiert die Bearbeitung räumlich direkt am fertigen Quiz.
- **Sofortige Live-Übernahme („In Vorschau anwenden“)**: Über die neue Schaltfläche *„In Vorschau anwenden“* (mit Vorschau-Auge) können Änderungen an Texten, Optionen und Didaktik sofort in die Simulator-Vorschau übertragen werden, ohne den Editor schließen zu müssen.
- **Modus-Umschaltung (Drawer ⤢ Vollbild)**: Redakteur:innen können jederzeit über die Kopfzeile zwischen dem seitlichen Schiebe-Drawer und dem klassischen zentrierten Vollbild-Modal wechseln (Präferenz wird lokal gespeichert).
- **Format-Icons in der Editor-Navigationsleiste**: Die Stations-Tabs im Editor zeigen nun ebenfalls die Format-Icons (`[ 1 🎭 ] [ 2 🧩 ]`) und den Titel an.
- **Studio-Modus mit einklappbarer Seitenleiste**: Die linke Spalte (Themen-Prompt & Format-Pool) kann mit einem Klick auf eine schlanke 48-Pixel-Iconleiste minimiert werden, um maximalen Arbeitsplatz für Vorschau und Editor-Drawer freizugeben.

## Neu in v0.3.0 (Streamlined Workspace & Station-Format-Icons)

- **Sticky Action-Footer (Linke Spalte)**: Der Schieberegler für die Stationsanzahl und der primäre Generierungs-Button („Interaktives Quiz mit Gemini generieren“) sind nun fest am unteren Rand verankert. Dadurch muss bei langen Prompts, Vorlagen oder Wissensdokumenten nicht mehr nach unten gescrollt werden.
- **Kompakte Format-Chips**: Die bisherigen großen 2-Spalten-Karten für die 10 Spielmechaniken wurden durch platzsparende, interaktive Format-Chips (Pills) mit Icons und Aktiv-/Inaktiv-Status ersetzt (70 % Platzersparnis).
- **Format-Icons auf der Stations-Timeline**: Die Stations-Auswahlbuttons in der Vorschau zeigen nun direkt das Format-Icon neben der Nummer an (`[ 1 🎭 ] [ 2 🧩 ] [ 3 🔢 ] ... [ 🏆 Ergebnis ]`). Redakteur:innen sehen sofort die didaktische Methodenvielfalt des Quiz.
- **Bereinigte Vorschau-Toolbar**: Die Toolbar wurde klar gegliedert (Redaktions-Tools links, Stations-Aktionen und Viewport-Steuerung rechts). Die redundante Schriftgrößen-Umschaltung `A / A+` in der oberen Leiste wurde entfernt und verbleibt aufgeräumt direkt im Header des interaktiven Quiz-Simulators.

## Neu in v0.2.9 (Dynamisches Format-Badge im Pool)

- **Dynamische Formatzählung im Pool-Badge**: Die Kopfzeile des Format-Akkordeons berechnet die Gesamtzahl der Spielmechaniken nun dynamisch (`Pool: Alle 10 Formate erlaubt` statt bisher statisch „9“) und zeigt bei Teil-Auswahl exakt an, wie viele der 10 Formate aktiviert sind.

## Neu in v0.2.8 (Verzweigte Fallbeispiele, CI-Build-Beschleunigung & Chunking)

- **10. Lernmechanik „Verzweigtes Fallbeispiel (Branching Scenario)“**: Situationsgestützte Szenarien mit 2- oder 3-stufiger konvergenter Verzweigung. Interaktive Pfadauswahl mit differenzierten Zwischenkonsequenzen, didaktischen ZQP-Tipps und reflexivem Abschluss inklusive Wiederholungs-Möglichkeit.
- **Vollständiger WYSIWYG-Szenario-Editor**: Sämtliche Szenen, Situationsbeschreibungen, Konsequenzen, ZQP-Ratschläge und optimale Handlungsstränge können im modalen Stationseditor direkt gepflegt und angepasst werden.
- **Standalone HTML-Export**: Verzweigte Fallbeispiele werden vollständig in autonome, barrierefreie HTML5-Dateien mit robuster JavaScript-Zustandsverwaltung und Lösungsanzeige kompiliert.
- **Qualitäts- & Glossar-Integration**: Der automatische Qualitätsprüfer (Flesch-Index, ZQP-Begründungsquote, Fachglossar-Audit) und die 1-Klick-Autokorrektur unterstützen alle Ebenen des Fallbeispiels nahtlos.
- **CI- & Build-Optimierungen**: Integration von `cargo check` und `swatinem/rust-cache@v2` in GitHub Actions für schnelle Pipeline-Durchläufe, flexibleres Build-Skript und Rollup-Chunk-Splitting (Vendor, Icons, PDF).

## Neu in v0.2.7 (WYSIWYG-Stationen, Token-Optimierung, Glossar-Audit & Barrierearmut)

- **Vollständige WYSIWYG-Station-Verwaltung**: Stationen können nun frei per Klick nach links/rechts verschoben (`‹` / `›`), dupliziert, gelöscht und als neue Station aus allen 10 Quiz-Formaten angelegt werden. Optionen lassen sich dynamisch hinzufügen und entfernen.
- **Token- & Prompt-Effizienz**: Entlastung des Gemini-Prompts und JSON-Schemas um statischen HTML/CSS/JS-Code – spart rund 25 % Token und sorgt für schnellere, robustere Generierungen.
- **Speichersicherheit (LocalStorage Quota)**: Automatisches Bereinigen schwerer kompilierter Bundles vor dem Speichern in LocalStorage, Fallback-Kompaktierung und visuelle Warnung bei Speicher-Überlauf.
- **Qualitäts-Audit & ZQP-Glossar**: Automatischer Scan nach veralteten/unerwünschten Begriffen (z. B. „Verwirrtheit“, „Pflegebedürftiger“) inklusive 1-Klick-Autokorrektur aller betroffenen Stationen.
- **Barrierefreiheit (A / A+ Schriftgrößen-Umschaltung)**: Schnelle Umschaltung für große Schriftgröße in der Vorschau und im HTML-Export inklusive sanftem vertikalen Scrolling.
- **Globale Tastenkürzel**: `Escape` schließt alle Modals zuverlässig, `Strg+Z` und `Strg+Y` ermöglichen schnelles Rückgängigmachen / Wiederholen im Entwurfsverlauf.

## Neu in v0.2.6 (Layout-Fix für Redaktionsleitfaden & Glossar)

- **Layout & Overflow-Fix im Redaktionsleitfaden**: Horizontales Scrollen und abgeschnittene Formularbereiche im Einstellungsfenster behoben (`overflow-x-hidden`, verbreitertes Modal auf `max-w-3xl`).
- **Neues 2-Zeilen-Formular für Glossarbegriffe**: Klare getrennte Felder für *„Vermeiden (Alter Begriff)“*, *„Bevorzugter ZQP-Begriff“* und Notizen mit Schnellbedienung via Enter-Taste.
- **Stabile Tabellenbreiten**: Feste prozentuale Spalten und automatischer Zeilenumbruch für das geschützte ZQP-Fachglossar.

## Neu in v0.2.5 (Modell-Standard `gemini-3.8-flash` & Dynamischer Modellabruf)

- **Gemini-Standardmodell `gemini-3.8-flash`**: Das Modell `gemini-3.8-flash` ist nun fest als primäres Standardmodell voreingestellt.
- **Dynamischer Modell-Abruf**: In den Einstellungen wird die Liste verfügbarer Modelle per Klick oder beim Öffnen direkt von der Google Gemini API geladen. Es werden nur tatsächlich unterstützte Modelle angezeigt.
- **Automatische Einstellungs-Migration**: Veraltete oder fehlerhafte Modellnamen (z. B. `gemini-3.0-flash`) in lokalen Nutzer-Einstellungen werden beim Start vollautomatisch auf `gemini-3.8-flash` migriert.
- **Self-Healing Fallback**: Der API-Client fängt etwaige 404-Fehler ab und leitet Anfragen sicher an `gemini-3.8-flash` weiter.

## Neu in v0.2.4 (Gemini-Modell-Korrektur & Self-Healing Fallback)

- **Standardmodell korrigiert auf `gemini-1.5-flash`**: Das offizielle, von Google für die v1beta-API unterstützte Standardmodell `gemini-1.5-flash` ist nun fest als primäres Modell voreingestellt.
- **Automatische Einstellungs-Migration**: Bisher gespeicherte ungültige Modellnamen (z. B. `gemini-3.0-flash` oder `gemini-2.5-flash`) werden beim Start der App und beim Öffnen der Einstellungen vollautomatisch und geräuschlos auf das stabile `gemini-1.5-flash` migriert.
- **Self-Healing Fallback im API-Client**: Sollte ein Modell von der Google API mit `404 Not Found` beantwortet werden, bricht die Generierung nicht mehr mit einer Fehlermeldung ab. Die App wechselt stattdessen automatisch zu `gemini-1.5-flash`, wiederholt die Anfrage und speichert das funktionierende Modell dauerhaft ab.
- **Optimiertes Modell-Auswahlmenü**: In den Einstellungen steht nun ein klares Auswahlmenü mit verständlichen Empfehlungen bereit (`gemini-1.5-flash` als Standard, `gemini-1.5-pro` für komplexe Kontexte, `gemini-2.0-flash`).

## Neu in v0.2.3 (Web-URL Wissensbasis, API-Key Transparenz & UI-Klarheit)

- **Webseiten-Import als Wissensbasis (URL)**: Web-Artikel (z. B. von zqp.de) können nun direkt per URL als Wissensbasis importiert werden. Die native Desktop-Engine lädt die Seite ohne Browser-CORS-Blockaden und extrahiert automatisch den relevanten Fließtext (ohne Navigation, Menüs und Footer).
- **Transparenter KI-Verbindungsstatus & API-Key Hinweise**:
  - Im Header signalisiert ein Live-Badge sofort, ob die Gemini-KI aktiv verbunden ist (`🟢 KI: gemini-...`) oder ob die App im `🟡 Demo-Modus (API-Key fehlt)` läuft. Mit einem Klick gelangt man direkt in die Einstellungen.
  - Beim Versuch, ein Quiz zu generieren oder zu verfeinern, ohne dass ein API-Schlüssel hinterlegt ist, weist ein deutlicher Dialog darauf hin, anstatt stillschweigend ein statisches Sturzpräventions-Musterquiz zu laden oder Verfeinerungen zu simulieren.
  - Das Offline-Musterquiz wird unmissverständlich mit `[Offline-Demo]` gekennzeichnet.
- **Klarheit bei Spielformaten vs. Quizlänge**:
  - Der Abschnitt für Spielmechaniken ist nun präzise als *„Erlaubte Spielformate (Pool)“* gekennzeichnet.
  - Ein Hilfetext am Stationsregler stellt klar: Der Schieberegler bestimmt die tatsächliche Anzahl der Lernstationen im Quiz; die KI wählt dafür die didaktisch am besten passenden Formate aus dem aktivierten Pool.

## Neu in v0.2.2 (Stations-Schatzkiste 1-Klick-Workflow & Live-Synchronisation)

- **1-Klick-Favoriten direkt in der Vorschau**: Neuer Button `⭐ In Schatzkiste` in der Vorschau-Aktionsleiste zum sekundenschnellen Sichern gelungener Stationen als Vorlagen ohne Umweg über den Bearbeiten-Modus.
- **Stern-Markierung in der Stations-Navigation**: Alle Stationen, die bereits als Vorlage in der Schatzkiste hinterlegt sind, werden in der Leiste `[ 1 ] [ 2 ⭐ ] ...` mit einem goldenen Sternchen hervorgehoben.
- **Live-Synchronisation im Schatzkisten-Dialog**: Sofortige Aktualisierung beim Öffnen des Vorlagen-Fensters sowie bei Hinzufügen/Löschen von Stationen via globaler Speicher-Events.

## Neu in v0.2.1 (Redaktions-Navigation & Feinschliff)

- **Freie Stations-Navigation für Redakteure**: In der Vorschau kann über eine Navigationsleiste (`[ ‹ ] [ 1 ] [ 2 ] ... [ › ] [ 🏆 Ergebnis ]`) jederzeit direkt zwischen allen Stationen und der Auswertungsseite gesprungen werden, ohne Fragen lösen zu müssen.
- **100 % getreue Web-Vorschau (1:1)**: Die Quiz-Vorschau entspricht nun exakt der finalen Webeinbettung (keine störenden Hilfsbuttons in der Quizkarte).
- **Kompakte Themenvorlagen**: Aufklappbare ZQP-Themenvorlagen, damit das Prompt-Eingabefeld aufgeräumt und fokussiert bleibt.
- **Eleganter Status-Pill**: Custom ZQP-Redaktionsstatus im Header statt Standard-HTML-Dropdown.
- **Revisionsanzeige & Export-Optimierung**: Saubere Beschriftung als „Revision X“; standardmäßig deaktivierte Tailwind-CDN-Option im Code-Export für nahtloses CMS-Copy & Paste.

## Neu in v0.2.0 (Redaktions-Workflow & Autorenschaft)

- **Quelltext-Abgleich & Zitat-Finder (Anti-Halluzination)**: Split-Screen-Inspektor zum Verifizieren von Quizfragen gegen hochgeladene ZQP-Broschüren und Leitlinien mit Textstellen-Highlighting.
- **ZQP-Redaktionsleitfaden & Fachglossar**: Zentrale Vorgaben für personenzentrierte Sprache und geschützte ZQP-Begriffe (z. B. *„Menschen mit Demenz“* statt *„Demenzkranke“*), die jedem Prompt automatisch mitgegeben werden.
- **Einzelstations-Varianten (3 Varianten / Neu würfeln)**: Generierung von drei didaktischen Alternativen (pointiert, Praxis-Fallbeispiel, alternative Mechanik) für einzelne Stationen.
- **Stations-Schatzkiste (Vorlagen-Bibliothek)**: Beliebte oder standardisierte Stationen speichern und mit 1 Klick in künftige Quizze übernehmen.
- **Team-Dateiaustausch (`.zqpquiz`) & Freigabestatus**: Export/Import von Projektdateien, Drag & Drop sowie Redaktionsstufen (*Entwurf* ➔ *In Fachprüfung* ➔ *Freigegeben für Web*).
- **Offizielles App-Icon**: Maßgeschneidertes ZQP-Desktop-Icon („Das Qualitäts-Puzzle“) für Windows, macOS und Browser-Favicon.

