![Logo](../../admin/jellyfin.png)

# ioBroker.jellyfin – Anleitung

Sieh in ioBroker, was auf deinen [Jellyfin](https://jellyfin.org)-Apps läuft, und steuere sie – Film anhalten, wenn es klingelt, Licht dimmen, wenn ein Film startet, oder das Cover in der Visualisierung anzeigen.

## Was du damit machen kannst

- Auf jeder Jellyfin-App (Fernseher, Handy, Browser) sehen, was läuft: Titel, Serie, Folge, Cover, Position
- Einen Film, eine Serie, eine Folge, ein Album oder ein Lied über den Titel starten
- Abspielen, Pause, Stopp, vor- und zurückspulen, an eine Stelle springen
- Lautstärke ändern oder stumm schalten
- Eine Meldung auf dem Fernseher anzeigen (z. B. „Es hat geklingelt“)
- Die Bibliotheken neu einlesen lassen

## Was du brauchst

- Einen Jellyfin-Server ab Version 12
- Die Jellyfin-App auf den Geräten, die du sehen oder steuern willst

## Einrichtung in 3 Schritten

1. **Schlüssel in Jellyfin anlegen:** Jellyfin im Browser öffnen → **Dashboard** → **API-Schlüssel** → **+**, Name `ioBroker`, Schlüssel kopieren.
2. **Adapter installieren** und die Instanz-Einstellungen öffnen.
3. **Server-Adresse** so eintragen, wie du Jellyfin im Browser öffnest (mit Port, z. B. `http://192.168.1.10:8096`), dazu den **Schlüssel**, speichern.

Fertig. Jede Jellyfin-App, die mit dem Server verbunden ist, erscheint jetzt als Gerät unter `jellyfin.0`.

## Die Werte nutzen

Jedes Gerät hat drei Ordner:

| Ordner | Inhalt |
|---|---|
| `info` | Gerätename, App, Benutzer, ob es verbunden ist und ob es sich steuern lässt |
| `media` | Was läuft: `state` (play / pause / stop), `title`, `series`, `season`, `episode`, `cover`, `elapsed`, `duration`, dazu `seek`, `volume`, `mute` |
| `command` | Tasten: `play`, `pause`, `stop`, `next`, `previous`, `forward`, `rewind`, `volumeUp`, `volumeDown`, `toggleMute`, `playTitle` und `message` |

**Beispiele**

- **Licht dimmen, wenn ein Film startet:** auf `jellyfin.0.<gerät>.media.state` = `play` reagieren.
- **Film starten:** Titel in `jellyfin.0.<gerät>.command.playTitle` schreiben, z. B. `Kevin - Allein zu Haus`.
- **Pause, wenn es klingelt:** `jellyfin.0.<gerät>.command.pause` auf `true` setzen.
- **Meldung auf dem Fernseher:** Text in `jellyfin.0.<gerät>.command.message` schreiben.
- **Cover in VIS:** `jellyfin.0.<gerät>.media.cover` als Bildadresse verwenden.
- **In die Mitte springen:** `50` in `media.seek` schreiben (Prozent des Films).

Unter `jellyfin.0.server` stehen Server-Version, ob ein Update oder Neustart ansteht, wie viele Geräte verbunden sind und abspielen, und die Taste `refreshLibrary` zum Einlesen aller Bibliotheken.

## Gut zu wissen

- **Ein Gerät, zwei Verbindungen:** Die Jellyfin-Apps für Handy, Tablet und Fernseher melden sich zweimal beim Server an (App und Player). Der Adapter fasst beides zu einem Gerät zusammen: Du siehst, was der Player zeigt, und die Befehle gehen an die App.
- **Ein Gerät steht auf „nicht steuerbar“** (`info.remoteControl` = false), obwohl die App offen ist: App neu starten. Hilft das nicht, in der App ab- und wieder anmelden.
- **Lautstärke** funktioniert je nach Gerät unterschiedlich:

| Gerät | Lautstärke-Wert | Lauter / leiser | Stumm |
|---|---|---|---|
| Browser | ✔ | ✔ | ✔ |
| TV-App (Fire TV, NVIDIA SHIELD, Android TV) | ✘ nur ein kleiner Schritt | ✔ | ✔ (nicht, wenn der Ton über einen AV-Receiver läuft) |
| Handy-/Tablet-App | ✘ (Systemlautstärke) | ✘ | ✔ |

- **Android-Handy-App:** Mit dem integrierten Player (Standard) siehst du, was läuft, die App nimmt aber keine Befehle an. Fernsteuern geht mit dem **Web-Player** (App-Einstellungen) – ein per ioBroker gestarteter Film wartet dann, bis man auf dem Handy einmal auf Play tippt.
- **iPad-App:** funktioniert ohne Einstellungen, ein per ioBroker gestarteter Film läuft sofort los.
- **Meldungen:** TV-Apps blenden Meldungen mit Anzeigedauer nach 2–3 Sekunden aus, egal welche Zeit eingestellt ist. Im Browser bleiben Meldungen ohne Anzeigedauer stehen, bis man sie schließt.
- **Ein Gerät steht auf „nicht verbunden“:** Die App ist geschlossen oder das Gerät aus. Sobald die App wieder verbunden ist, aktualisiert sich alles von selbst.
- Ein Befehl wird nur gesendet, wenn die App ihn gerade annimmt. Sonst steht ein kurzer Hinweis im Log.

## Fragen und Probleme

- **„The Jellyfin server rejected the API key“** – Schlüssel prüfen oder im Jellyfin-Dashboard einen neuen anlegen.
- **„Jellyfin was not found at this address“** – Adresse und Port prüfen, bei einem Reverse Proxy auch den Pfad (z. B. `https://example.com/jellyfin`).
- **„Cannot reach the Jellyfin server“** – Läuft der Server und ist er vom ioBroker-Rechner aus erreichbar?
- Etwas anderes? Bitte ein [Issue](https://github.com/Schimi1983/ioBroker.jellyfin/issues) mit Log (Loglevel *debug*) anlegen.

Technische Details (alle Datenpunkte, Skript-Befehle, Experteneinstellungen) stehen im Abschnitt *For advanced users* der [englischen README](../../README.md).

## Unterstützung

Der Adapter ist kostenlos und bleibt es. Wenn er dir nützt und du Danke sagen willst, kannst du die Entwicklung unterstützen:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Schimi1983-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Schimi1983)
[![PayPal](https://img.shields.io/badge/PayPal-Spenden-00457C?logo=paypal&logoColor=white)](https://paypal.me/Schimi1983)

Fehlermeldungen und Ideen in den [Issues](https://github.com/Schimi1983/ioBroker.jellyfin/issues) helfen genauso.
