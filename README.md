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
