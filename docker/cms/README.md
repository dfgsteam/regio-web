# AstroCMS

Das CMS läuft getrennt von der statischen Website. Es klont dieses Repository
in das persistente Volume `cms-data`. Ein Push auf `main` startet den
bestehenden GitHub-Actions-Deploy per FTP.

## Bearbeiten und veröffentlichen

Gespeicherte Änderungen liegen zunächst im CMS-Volume. Erst die bewusste
Aktion zum Committen und Pushen überträgt sie nach GitHub und löst damit
einen Deploy aus. Mehrere kleine Änderungen können vor dem Push gesammelt
werden. AstroCMS bietet dafür keinen eingebauten 30-Minuten-Timer; ein
automatischer Git-Push per Cronjob würde mit dem Git-Workflow des Editors
konkurrieren.

Unabhängig davon startet `.github/workflows/deploy.yml` derzeit selbst jede
Stunde per Zeitplan, um zwischengespeicherte Anmeldekapazitäten zu erneuern.

## Einrichtung

1. Einen Docker-Host mit Reverse Proxy bereitstellen. Der bisherige FTP-Webspace
   muss selbst kein Docker ausführen.
2. `.env.example` in diesem Verzeichnis nach `.env` kopieren. `GIT_PAT` muss ein
   Fine-grained GitHub Token für ausschließlich `dfgsteam/regio-web` mit
   **Contents: Read and write** sein. Die ausgefüllte `.env` bleibt nur auf
   dem Docker-Host.
3. Aus dem Repository-Root starten:

   ```sh
   docker compose --env-file docker/cms/.env -f docker/cms/compose.yaml up -d
   ```

4. Eine eigene CMS-Domain per Reverse Proxy auf `http://127.0.0.1:4001`
   leiten. Die **gesamte Domain**, einschließlich `/astrocms` und API, mit
   einem Authentik Proxy Provider im Single-Application-Forward-Auth-Modus
   schützen. Den Zugriff auf die CMS-Redaktionsgruppe beschränken. Das CMS
   hat kein zweites Passwort.
5. Vor der Nutzung prüfen, dass ein anonymer Aufruf von
   `https://<cms-domain>/astrocms` zu Authentik umgeleitet wird.

Die Compose-Datei setzt voraus, dass der Reverse Proxy auf demselben Host
läuft und dessen Loopback-Adresse erreichen kann. Läuft er selbst als
Container, stattdessen beide über ein privates Docker-Netzwerk verbinden und
Port 4001 nicht veröffentlichen. Die aktuelle Port-Zuordnung `4001:4001`
bindet an alle Host-Interfaces. Solange sie so bleibt, muss der Zugriff auf
Port 4001 zusätzlich durch die Host-Firewall auf den Reverse Proxy begrenzt
sein. Für einen Proxy auf demselben Host stattdessen
`127.0.0.1:4001:4001` verwenden.

## Wenn der Container beim Klonen neu startet

AstroCMS startet seinen Webserver erst nach einem erfolgreichen Git-Clone.
Ein `SSL connection timeout` beim Clone ist ein Verbindungsproblem des
Docker-Hosts oder Containers zu `github.com:443`, kein Hinweis auf einen
falschen GitHub-Token. Diese beiden Befehle testen die Verbindung mit einem
öffentlichen Repository, ohne den Token auszugeben:

```sh
git ls-remote https://github.com/git/git.git HEAD
docker compose --env-file docker/cms/.env -f docker/cms/compose.yaml run --rm --no-deps --entrypoint sh cms -lc 'git ls-remote https://github.com/git/git.git HEAD'
```

Scheitern beide Befehle mit einem Timeout, ausgehendes HTTPS, DNS oder einen
erforderlichen Netzwerk-Proxy auf dem Docker-Host prüfen. Funktioniert nur
der erste, Docker-Netzwerk und DNS prüfen. Erst wenn der Clone funktioniert,
die CMS-Adresse und danach die Authentik-Weiterleitung testen.

AstroCMS erstellt Commits mit dem gemeinsamen GitHub-Token. Authentik
kontrolliert den Zugang, erzeugt aber keine eigenen GitHub-Identitäten pro
Redakteur. Für eine Freigabe vor dem Deploy `ASTROCMS_PR_BASED_EDITS=true`
setzen und dem Token zusätzlich **Pull requests: Read and write** geben.
Redakteure erstellen dann im CMS einen Branch und Pull Request; dessen Merge
nach `main` startet den bestehenden Deploy.

Vor der Freigabe der Zeltlager-Bearbeitung prüfen, ob AstroCMS die Imports
und Komponenten in `src/content/camps/*.mdx` beim Speichern erhält.
