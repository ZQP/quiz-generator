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

## Neu in v0.2.0 (Redaktions-Workflow & Autorenschaft)

- **Quelltext-Abgleich & Zitat-Finder (Anti-Halluzination)**: Split-Screen-Inspektor zum Verifizieren von Quizfragen gegen hochgeladene ZQP-Broschüren und Leitlinien mit Textstellen-Highlighting.
- **ZQP-Redaktionsleitfaden & Fachglossar**: Zentrale Vorgaben für personenzentrierte Sprache und geschützte ZQP-Begriffe (z. B. *„Menschen mit Demenz“* statt *„Demenzkranke“*), die jedem Prompt automatisch mitgegeben werden.
- **Einzelstations-Varianten (3 Varianten / Neu würfeln)**: Generierung von drei didaktischen Alternativen (pointiert, Praxis-Fallbeispiel, alternative Mechanik) für einzelne Stationen.
- **Stations-Schatzkiste (Vorlagen-Bibliothek)**: Beliebte oder standardisierte Stationen speichern und mit 1 Klick in künftige Quizze übernehmen.
- **Team-Dateiaustausch (`.zqpquiz`) & Freigabestatus**: Export/Import von Projektdateien, Drag & Drop sowie Redaktionsstufen (*Entwurf* ➔ *In Fachprüfung* ➔ *Freigegeben für Web*).
- **Offizielles App-Icon**: Maßgeschneidertes ZQP-Desktop-Icon („Das Qualitäts-Puzzle“) für Windows, macOS und Browser-Favicon.

