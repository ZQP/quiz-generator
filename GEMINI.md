# ZQP Quiz Generator - Projekt-Richtlinien

## ⚠️ WICHTIGE REGEL FÜR DIE RELEASE-STEUERUNG

1. **STRIKTES VERBOT EIGENMÄCHTIGER RELEASES**:
   Der KI-Assistent darf **NIEMALS** selbstständig oder ungefragt ein Release erstellen, ein Git-Release-Tag anlegen, einen GitHub Release veröffentlichen oder den Auto-Updater über `latest.json` anstoßen.
2. **AUSDRÜCKLICHE FREIGABE DURCH MARCO ERFORDERLICH**:
   Vor jedem Release müssen die Änderungen fertig vorbereitet und getestet werden. Erst wenn Marco explizit seine Freigabe erteilt (z. B. „Ja, mach das Release“), darf das Release kompiliert, signiert und veröffentlicht werden.

## 🤖 KI-MODELLE

1. **STANDARD-MODELL**:
   Das offizielle Standardmodell für Google Gemini ist immer **`gemini-3.8-flash`**.
2. **KEINE ERFUNDENEN MODELLE**:
   Es dürfen keine erfundenen Modellbezeichnungen (wie z. B. `gemini-3.8-pro` oder `gemini-3.0-flash`) hardcodiert oder vorgeschlagen werden. `gemini-3.8-pro` existiert nicht!
3. **DYNAMISCHER API-ABRUF**:
   In den Einstellungen wird die Modell-Liste dynamisch über die Google Gemini API (`https://generativelanguage.googleapis.com/v1beta/models?key=...`) für den hinterlegten API-Schlüssel geladen. Es werden ausschließlich Modelle angezeigt, die Google tatsächlich für `generateContent` zurückmeldet. `gemini-3.8-flash` bleibt stets an erster Stelle als Standard selektierbar.
