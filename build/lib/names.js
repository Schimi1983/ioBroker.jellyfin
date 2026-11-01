"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var names_exports = {};
__export(names_exports, {
  TRANSLATED_NAMES: () => TRANSLATED_NAMES,
  tr: () => tr
});
module.exports = __toCommonJS(names_exports);
const t = (en, de, ru, pt, nl, fr, it, es, pl, uk, zh) => ({ en, de, ru, pt, nl, fr, it, es, pl, uk, "zh-cn": zh });
const LIST = [
  // channels
  t(
    "Information",
    "Informationen",
    "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F",
    "Informa\xE7\xF5es",
    "Informatie",
    "Informations",
    "Informazioni",
    "Informaci\xF3n",
    "Informacje",
    "\u0406\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F",
    "\u4FE1\u606F"
  ),
  t("Media", "Medien", "\u041C\u0435\u0434\u0438\u0430", "M\xEDdia", "Media", "M\xE9dia", "Media", "Medios", "Multimedia", "\u041C\u0435\u0434\u0456\u0430", "\u5A92\u4F53"),
  t(
    "Commands",
    "Befehle",
    "\u041A\u043E\u043C\u0430\u043D\u0434\u044B",
    "Comandos",
    "Opdrachten",
    "Commandes",
    "Comandi",
    "Comandos",
    "Polecenia",
    "\u041A\u043E\u043C\u0430\u043D\u0434\u0438",
    "\u547D\u4EE4"
  ),
  t(
    "Jellyfin server",
    "Jellyfin-Server",
    "\u0421\u0435\u0440\u0432\u0435\u0440 Jellyfin",
    "Servidor Jellyfin",
    "Jellyfin-server",
    "Serveur Jellyfin",
    "Server Jellyfin",
    "Servidor Jellyfin",
    "Serwer Jellyfin",
    "\u0421\u0435\u0440\u0432\u0435\u0440 Jellyfin",
    "Jellyfin \u670D\u52A1\u5668"
  ),
  // info
  t(
    "Device name",
    "Ger\xE4tename",
    "\u0418\u043C\u044F \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "Nome do dispositivo",
    "Apparaatnaam",
    "Nom de l'appareil",
    "Nome del dispositivo",
    "Nombre del dispositivo",
    "Nazwa urz\u0105dzenia",
    "\u041D\u0430\u0437\u0432\u0430 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u044E",
    "\u8BBE\u5907\u540D\u79F0"
  ),
  t(
    "App",
    "App",
    "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435",
    "Aplicativo",
    "App",
    "Application",
    "App",
    "Aplicaci\xF3n",
    "Aplikacja",
    "\u0417\u0430\u0441\u0442\u043E\u0441\u0443\u043D\u043E\u043A",
    "\u5E94\u7528"
  ),
  t(
    "App version",
    "App-Version",
    "\u0412\u0435\u0440\u0441\u0438\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
    "Vers\xE3o do aplicativo",
    "App-versie",
    "Version de l'application",
    "Versione dell'app",
    "Versi\xF3n de la aplicaci\xF3n",
    "Wersja aplikacji",
    "\u0412\u0435\u0440\u0441\u0456\u044F \u0437\u0430\u0441\u0442\u043E\u0441\u0443\u043D\u043A\u0443",
    "\u5E94\u7528\u7248\u672C"
  ),
  t(
    "User",
    "Benutzer",
    "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C",
    "Usu\xE1rio",
    "Gebruiker",
    "Utilisateur",
    "Utente",
    "Usuario",
    "U\u017Cytkownik",
    "\u041A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447",
    "\u7528\u6237"
  ),
  t(
    "Connected to the server",
    "Mit dem Server verbunden",
    "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u043A \u0441\u0435\u0440\u0432\u0435\u0440\u0443",
    "Conectado ao servidor",
    "Verbonden met de server",
    "Connect\xE9 au serveur",
    "Connesso al server",
    "Conectado al servidor",
    "Po\u0142\u0105czono z serwerem",
    "\u041F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u0434\u043E \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
    "\u5DF2\u8FDE\u63A5\u5230\u670D\u52A1\u5668"
  ),
  t(
    "Can be controlled remotely",
    "Fernsteuerbar",
    "\u041C\u043E\u0436\u043D\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0443\u0434\u0430\u043B\u0451\u043D\u043D\u043E",
    "Pode ser controlado remotamente",
    "Op afstand bedienbaar",
    "Contr\xF4lable \xE0 distance",
    "Controllabile da remoto",
    "Se puede controlar a distancia",
    "Mo\u017Cna sterowa\u0107 zdalnie",
    "\u041C\u043E\u0436\u043D\u0430 \u043A\u0435\u0440\u0443\u0432\u0430\u0442\u0438 \u0434\u0438\u0441\u0442\u0430\u043D\u0446\u0456\u0439\u043D\u043E",
    "\u53EF\u8FDC\u7A0B\u63A7\u5236"
  ),
  t(
    "Last activity",
    "Letzte Aktivit\xE4t",
    "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C",
    "\xDAltima atividade",
    "Laatste activiteit",
    "Derni\xE8re activit\xE9",
    "Ultima attivit\xE0",
    "\xDAltima actividad",
    "Ostatnia aktywno\u015B\u0107",
    "\u041E\u0441\u0442\u0430\u043D\u043D\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u0456\u0441\u0442\u044C",
    "\u6700\u540E\u6D3B\u52A8"
  ),
  // media
  t(
    "Playback state",
    "Wiedergabestatus",
    "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F",
    "Estado da reprodu\xE7\xE3o",
    "Afspeelstatus",
    "\xC9tat de lecture",
    "Stato di riproduzione",
    "Estado de reproducci\xF3n",
    "Stan odtwarzania",
    "\u0421\u0442\u0430\u043D \u0432\u0456\u0434\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F",
    "\u64AD\u653E\u72B6\u6001"
  ),
  t("Title", "Titel", "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "T\xEDtulo", "Titel", "Titre", "Titolo", "T\xEDtulo", "Tytu\u0142", "\u041D\u0430\u0437\u0432\u0430", "\u6807\u9898"),
  t(
    "Media type",
    "Medientyp",
    "\u0422\u0438\u043F \u043C\u0435\u0434\u0438\u0430",
    "Tipo de m\xEDdia",
    "Mediatype",
    "Type de m\xE9dia",
    "Tipo di media",
    "Tipo de medio",
    "Typ multimedi\xF3w",
    "\u0422\u0438\u043F \u043C\u0435\u0434\u0456\u0430",
    "\u5A92\u4F53\u7C7B\u578B"
  ),
  t("Series", "Serie", "\u0421\u0435\u0440\u0438\u0430\u043B", "S\xE9rie", "Serie", "S\xE9rie", "Serie", "Serie", "Serial", "\u0421\u0435\u0440\u0456\u0430\u043B", "\u5267\u96C6"),
  t("Season", "Staffel", "\u0421\u0435\u0437\u043E\u043D", "Temporada", "Seizoen", "Saison", "Stagione", "Temporada", "Sezon", "\u0421\u0435\u0437\u043E\u043D", "\u5B63"),
  t(
    "Episode",
    "Folge",
    "\u042D\u043F\u0438\u0437\u043E\u0434",
    "Epis\xF3dio",
    "Aflevering",
    "\xC9pisode",
    "Episodio",
    "Episodio",
    "Odcinek",
    "\u0415\u043F\u0456\u0437\u043E\u0434",
    "\u96C6"
  ),
  t(
    "Artist",
    "Interpret",
    "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C",
    "Artista",
    "Artiest",
    "Artiste",
    "Artista",
    "Artista",
    "Wykonawca",
    "\u0412\u0438\u043A\u043E\u043D\u0430\u0432\u0435\u0446\u044C",
    "\u827A\u672F\u5BB6"
  ),
  t("Album", "Album", "\u0410\u043B\u044C\u0431\u043E\u043C", "\xC1lbum", "Album", "Album", "Album", "\xC1lbum", "Album", "\u0410\u043B\u044C\u0431\u043E\u043C", "\u4E13\u8F91"),
  t("Genre", "Genre", "\u0416\u0430\u043D\u0440", "G\xEAnero", "Genre", "Genre", "Genere", "G\xE9nero", "Gatunek", "\u0416\u0430\u043D\u0440", "\u7C7B\u578B"),
  t("Year", "Jahr", "\u0413\u043E\u0434", "Ano", "Jaar", "Ann\xE9e", "Anno", "A\xF1o", "Rok", "\u0420\u0456\u043A", "\u5E74\u4EFD"),
  t(
    "Jellyfin id of the item",
    "Jellyfin-ID des Eintrags",
    "Jellyfin-ID \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
    "ID Jellyfin do item",
    "Jellyfin-id van het item",
    "ID Jellyfin de l'\xE9l\xE9ment",
    "ID Jellyfin dell'elemento",
    "ID de Jellyfin del elemento",
    "Identyfikator Jellyfin elementu",
    "Jellyfin-ID \u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
    "\u9879\u76EE\u7684 Jellyfin ID"
  ),
  t(
    "Cover URL",
    "Cover-Adresse",
    "URL \u043E\u0431\u043B\u043E\u0436\u043A\u0438",
    "URL da capa",
    "Cover-URL",
    "URL de la pochette",
    "URL della copertina",
    "URL de la car\xE1tula",
    "Adres URL ok\u0142adki",
    "URL \u043E\u0431\u043A\u043B\u0430\u0434\u0438\u043D\u043A\u0438",
    "\u5C01\u9762\u7F51\u5740"
  ),
  t(
    "Duration",
    "Dauer",
    "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    "Dura\xE7\xE3o",
    "Duur",
    "Dur\xE9e",
    "Durata",
    "Duraci\xF3n",
    "Czas trwania",
    "\u0422\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C",
    "\u65F6\u957F"
  ),
  t(
    "Position",
    "Position",
    "\u041F\u043E\u0437\u0438\u0446\u0438\u044F",
    "Posi\xE7\xE3o",
    "Positie",
    "Position",
    "Posizione",
    "Posici\xF3n",
    "Pozycja",
    "\u041F\u043E\u0437\u0438\u0446\u0456\u044F",
    "\u4F4D\u7F6E"
  ),
  t(
    "Position in percent (write to jump)",
    "Position in Prozent (schreiben zum Springen)",
    "\u041F\u043E\u0437\u0438\u0446\u0438\u044F \u0432 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u0430\u0445 (\u0437\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430)",
    "Posi\xE7\xE3o em percentagem (escrever para saltar)",
    "Positie in procent (schrijven om te springen)",
    "Position en pourcentage (\xE9crire pour sauter)",
    "Posizione in percentuale (scrivere per saltare)",
    "Posici\xF3n en porcentaje (escribir para saltar)",
    "Pozycja w procentach (zapisz, aby przeskoczy\u0107)",
    "\u041F\u043E\u0437\u0438\u0446\u0456\u044F \u0443 \u0432\u0456\u0434\u0441\u043E\u0442\u043A\u0430\u0445 (\u0437\u0430\u043F\u0438\u0448\u0456\u0442\u044C \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0443)",
    "\u4F4D\u7F6E\u767E\u5206\u6BD4\uFF08\u5199\u5165\u4EE5\u8DF3\u8F6C\uFF09"
  ),
  t(
    "Volume",
    "Lautst\xE4rke",
    "\u0413\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C",
    "Volume",
    "Volume",
    "Volume",
    "Volume",
    "Volumen",
    "G\u0142o\u015Bno\u015B\u0107",
    "\u0413\u0443\u0447\u043D\u0456\u0441\u0442\u044C",
    "\u97F3\u91CF"
  ),
  t(
    "Muted",
    "Stumm",
    "\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0430",
    "Sem som",
    "Gedempt",
    "Muet",
    "Muto",
    "Silenciado",
    "Wyciszony",
    "\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0443",
    "\u9759\u97F3"
  ),
  t(
    "Repeat",
    "Wiederholen",
    "\u041F\u043E\u0432\u0442\u043E\u0440",
    "Repetir",
    "Herhalen",
    "R\xE9p\xE9ter",
    "Ripeti",
    "Repetir",
    "Powtarzanie",
    "\u041F\u043E\u0432\u0442\u043E\u0440",
    "\u91CD\u590D"
  ),
  // commands
  t(
    "Play",
    "Abspielen",
    "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0441\u0442\u0438",
    "Reproduzir",
    "Afspelen",
    "Lecture",
    "Riproduci",
    "Reproducir",
    "Odtw\xF3rz",
    "\u0412\u0456\u0434\u0442\u0432\u043E\u0440\u0438\u0442\u0438",
    "\u64AD\u653E"
  ),
  t("Pause", "Pause", "\u041F\u0430\u0443\u0437\u0430", "Pausa", "Pauze", "Pause", "Pausa", "Pausa", "Pauza", "\u041F\u0430\u0443\u0437\u0430", "\u6682\u505C"),
  t(
    "Play / pause",
    "Abspielen / Pause",
    "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u0435 / \u043F\u0430\u0443\u0437\u0430",
    "Reproduzir / pausa",
    "Afspelen / pauze",
    "Lecture / pause",
    "Riproduci / pausa",
    "Reproducir / pausa",
    "Odtw\xF3rz / pauza",
    "\u0412\u0456\u0434\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F / \u043F\u0430\u0443\u0437\u0430",
    "\u64AD\u653E / \u6682\u505C"
  ),
  t("Stop", "Stopp", "\u0421\u0442\u043E\u043F", "Parar", "Stoppen", "Arr\xEAt", "Stop", "Detener", "Zatrzymaj", "\u0421\u0442\u043E\u043F", "\u505C\u6B62"),
  t(
    "Next",
    "Weiter",
    "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439",
    "Pr\xF3ximo",
    "Volgende",
    "Suivant",
    "Successivo",
    "Siguiente",
    "Nast\u0119pny",
    "\u041D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u0439",
    "\u4E0B\u4E00\u4E2A"
  ),
  t(
    "Previous",
    "Zur\xFCck",
    "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439",
    "Anterior",
    "Vorige",
    "Pr\xE9c\xE9dent",
    "Precedente",
    "Anterior",
    "Poprzedni",
    "\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u043D\u0456\u0439",
    "\u4E0A\u4E00\u4E2A"
  ),
  t(
    "Skip forward",
    "Vorspulen",
    "\u041F\u0435\u0440\u0435\u043C\u043E\u0442\u0430\u0442\u044C \u0432\u043F\u0435\u0440\u0451\u0434",
    "Avan\xE7ar",
    "Vooruitspoelen",
    "Avance rapide",
    "Avanti veloce",
    "Avanzar",
    "Przewi\u0144 do przodu",
    "\u041F\u0435\u0440\u0435\u043C\u043E\u0442\u0430\u0442\u0438 \u0432\u043F\u0435\u0440\u0435\u0434",
    "\u5FEB\u8FDB"
  ),
  t(
    "Skip back",
    "Zur\xFCckspulen",
    "\u041F\u0435\u0440\u0435\u043C\u043E\u0442\u0430\u0442\u044C \u043D\u0430\u0437\u0430\u0434",
    "Retroceder",
    "Terugspoelen",
    "Retour rapide",
    "Indietro veloce",
    "Retroceder",
    "Przewi\u0144 do ty\u0142u",
    "\u041F\u0435\u0440\u0435\u043C\u043E\u0442\u0430\u0442\u0438 \u043D\u0430\u0437\u0430\u0434",
    "\u5FEB\u9000"
  ),
  t(
    "Volume up",
    "Lauter",
    "\u0413\u0440\u043E\u043C\u0447\u0435",
    "Aumentar volume",
    "Volume omhoog",
    "Volume +",
    "Volume su",
    "Subir volumen",
    "G\u0142o\u015Bniej",
    "\u0413\u0443\u0447\u043D\u0456\u0448\u0435",
    "\u97F3\u91CF\u52A0"
  ),
  t(
    "Volume down",
    "Leiser",
    "\u0422\u0438\u0448\u0435",
    "Diminuir volume",
    "Volume omlaag",
    "Volume -",
    "Volume gi\xF9",
    "Bajar volumen",
    "Ciszej",
    "\u0422\u0438\u0445\u0456\u0448\u0435",
    "\u97F3\u91CF\u51CF"
  ),
  t(
    "Mute on/off",
    "Stumm an/aus",
    "\u0417\u0432\u0443\u043A \u0432\u043A\u043B/\u0432\u044B\u043A\u043B",
    "Mudo lig/desl",
    "Dempen aan/uit",
    "Muet on/off",
    "Muto on/off",
    "Silencio s\xED/no",
    "Wycisz w\u0142./wy\u0142.",
    "\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0443 \u0443\u0432\u0456\u043C\u043A./\u0432\u0438\u043C\u043A.",
    "\u9759\u97F3\u5F00/\u5173"
  ),
  t(
    "Play a film, episode or song by its title (or item id)",
    "Film, Folge oder Lied \xFCber den Titel (oder die ID) abspielen",
    "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0441\u0442\u0438 \u0444\u0438\u043B\u044C\u043C, \u044D\u043F\u0438\u0437\u043E\u0434 \u0438\u043B\u0438 \u043F\u0435\u0441\u043D\u044E \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E (\u0438\u043B\u0438 ID)",
    "Reproduzir um filme, epis\xF3dio ou m\xFAsica pelo t\xEDtulo (ou ID)",
    "Een film, aflevering of nummer afspelen op titel (of id)",
    "Lire un film, un \xE9pisode ou une chanson par son titre (ou son ID)",
    "Riproduci un film, un episodio o un brano per titolo (o ID)",
    "Reproducir una pel\xEDcula, episodio o canci\xF3n por su t\xEDtulo (o ID)",
    "Odtw\xF3rz film, odcinek lub utw\xF3r wed\u0142ug tytu\u0142u (lub ID)",
    "\u0412\u0456\u0434\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u0444\u0456\u043B\u044C\u043C, \u0435\u043F\u0456\u0437\u043E\u0434 \u0430\u0431\u043E \u043F\u0456\u0441\u043D\u044E \u0437\u0430 \u043D\u0430\u0437\u0432\u043E\u044E (\u0430\u0431\u043E ID)",
    "\u6309\u6807\u9898\uFF08\u6216 ID\uFF09\u64AD\u653E\u7535\u5F71\u3001\u5267\u96C6\u6216\u6B4C\u66F2"
  ),
  t(
    "Show message on the screen",
    "Meldung auf dem Bildschirm anzeigen",
    "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435",
    "Mostrar mensagem na tela",
    "Bericht op het scherm tonen",
    "Afficher un message \xE0 l'\xE9cran",
    "Mostra messaggio sullo schermo",
    "Mostrar mensaje en la pantalla",
    "Poka\u017C wiadomo\u015B\u0107 na ekranie",
    "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u043F\u043E\u0432\u0456\u0434\u043E\u043C\u043B\u0435\u043D\u043D\u044F \u043D\u0430 \u0435\u043A\u0440\u0430\u043D\u0456",
    "\u5728\u5C4F\u5E55\u4E0A\u663E\u793A\u6D88\u606F"
  ),
  t(
    'Send command (e.g. GoHome or {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Befehl senden (z. B. GoHome oder {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    '\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443 (\u043D\u0430\u043F\u0440. GoHome \u0438\u043B\u0438 {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Enviar comando (ex. GoHome ou {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Opdracht sturen (bijv. GoHome of {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Envoyer une commande (ex. GoHome ou {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Invia comando (ad es. GoHome o {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Enviar comando (p. ej. GoHome o {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    'Wy\u015Blij polecenie (np. GoHome lub {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    '\u041D\u0430\u0434\u0456\u0441\u043B\u0430\u0442\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 (\u043D\u0430\u043F\u0440. GoHome \u0430\u0431\u043E {"Name":"SetVolume","Arguments":{"Volume":"50"}})',
    '\u53D1\u9001\u547D\u4EE4\uFF08\u4F8B\u5982 GoHome \u6216 {"Name":"SetVolume","Arguments":{"Volume":"50"}}\uFF09'
  ),
  // server
  t(
    "Server name",
    "Servername",
    "\u0418\u043C\u044F \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
    "Nome do servidor",
    "Servernaam",
    "Nom du serveur",
    "Nome del server",
    "Nombre del servidor",
    "Nazwa serwera",
    "\u041D\u0430\u0437\u0432\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
    "\u670D\u52A1\u5668\u540D\u79F0"
  ),
  t(
    "Server version",
    "Server-Version",
    "\u0412\u0435\u0440\u0441\u0438\u044F \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
    "Vers\xE3o do servidor",
    "Serverversie",
    "Version du serveur",
    "Versione del server",
    "Versi\xF3n del servidor",
    "Wersja serwera",
    "\u0412\u0435\u0440\u0441\u0456\u044F \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
    "\u670D\u52A1\u5668\u7248\u672C"
  ),
  t(
    "Update available",
    "Update verf\xFCgbar",
    "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435",
    "Atualiza\xE7\xE3o dispon\xEDvel",
    "Update beschikbaar",
    "Mise \xE0 jour disponible",
    "Aggiornamento disponibile",
    "Actualizaci\xF3n disponible",
    "Dost\u0119pna aktualizacja",
    "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u0435 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F",
    "\u6709\u53EF\u7528\u66F4\u65B0"
  ),
  t(
    "Restart required",
    "Neustart erforderlich",
    "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A",
    "Rein\xEDcio necess\xE1rio",
    "Herstart vereist",
    "Red\xE9marrage requis",
    "Riavvio necessario",
    "Reinicio necesario",
    "Wymagany restart",
    "\u041F\u043E\u0442\u0440\u0456\u0431\u0435\u043D \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A",
    "\u9700\u8981\u91CD\u542F"
  ),
  t(
    "Connected devices",
    "Verbundene Ger\xE4te",
    "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D\u043D\u044B\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "Dispositivos conectados",
    "Verbonden apparaten",
    "Appareils connect\xE9s",
    "Dispositivi connessi",
    "Dispositivos conectados",
    "Po\u0142\u0105czone urz\u0105dzenia",
    "\u041F\u0456\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0456 \u043F\u0440\u0438\u0441\u0442\u0440\u043E\u0457",
    "\u5DF2\u8FDE\u63A5\u8BBE\u5907"
  ),
  t(
    "Devices playing",
    "Abspielende Ger\xE4te",
    "\u0412\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u044F\u0449\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
    "Dispositivos reproduzindo",
    "Afspelende apparaten",
    "Appareils en lecture",
    "Dispositivi in riproduzione",
    "Dispositivos reproduciendo",
    "Odtwarzaj\u0105ce urz\u0105dzenia",
    "\u041F\u0440\u0438\u0441\u0442\u0440\u043E\u0457, \u0449\u043E \u0432\u0456\u0434\u0442\u0432\u043E\u0440\u044E\u044E\u0442\u044C",
    "\u6B63\u5728\u64AD\u653E\u7684\u8BBE\u5907"
  ),
  t(
    "Scan all libraries",
    "Alle Bibliotheken einlesen",
    "\u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0441\u0435 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438",
    "Analisar todas as bibliotecas",
    "Alle bibliotheken scannen",
    "Analyser toutes les biblioth\xE8ques",
    "Scansiona tutte le librerie",
    "Escanear todas las bibliotecas",
    "Skanuj wszystkie biblioteki",
    "\u0421\u043A\u0430\u043D\u0443\u0432\u0430\u0442\u0438 \u0432\u0441\u0456 \u0431\u0456\u0431\u043B\u0456\u043E\u0442\u0435\u043A\u0438",
    "\u626B\u63CF\u6240\u6709\u5A92\u4F53\u5E93"
  )
];
const NAMES = new Map(LIST.map((n) => [n.en, n]));
function tr(en) {
  var _a;
  return (_a = NAMES.get(en)) != null ? _a : en;
}
const TRANSLATED_NAMES = new Set(NAMES.keys());
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TRANSLATED_NAMES,
  tr
});
//# sourceMappingURL=names.js.map
