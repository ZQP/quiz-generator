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

