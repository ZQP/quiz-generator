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

