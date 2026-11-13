@rem Install steps of the Axentra Studio QA kit (Windows), shared by "Installieren" and "Starten".
@rem Exit code 0 on success; prints the reason otherwise.
if not exist "%UV%" (
  echo FEHLER: Das Werkzeug im Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  exit /b 1
)
echo Axentra Studio (lokale Testversion) wird installiert.
echo Alles bleibt in diesem Ordner: "%KIT_ROOT%"
echo.
rem Files unpacked from a download carry the "from the internet" mark; clear it for the kit's own files.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath $env:KIT_ROOT -Recurse -File | Unblock-File" >nul 2>&1
echo [1/4] Python 3.13 bereitstellen (einmalig aus dem Internet) ...
"%UV%" venv --clear --python 3.13 "%ENV_DIR%"
if errorlevel 1 (
  echo FEHLER: Python konnte nicht bereitgestellt werden. Besteht eine Internetverbindung?
  exit /b 1
)
echo [2/4] Bibliotheken laden und pruefen (feste Versionen mit Pruefsummen) ...
"%UV%" pip install --python "%PY%" --require-hashes --no-deps --only-binary :all: -r "%KIT%\runtime-lock.txt"
if errorlevel 1 (
  echo FEHLER: Die Bibliotheken konnten nicht installiert werden. Besteht eine Internetverbindung?
  exit /b 1
)
echo [3/4] Axentra installieren ...
for %%W in ("%KIT%\wheels\*.whl") do "%UV%" pip install --python "%PY%" --no-deps "%%~fW"
if errorlevel 1 (
  echo FEHLER: Axentra konnte nicht installiert werden.
  exit /b 1
)
echo [4/4] Installation pruefen ...
"%UV%" pip check --python "%PY%"
if errorlevel 1 (
  echo FEHLER: Die Pruefung der Installation ist fehlgeschlagen.
  exit /b 1
)
"%KIT%\pg\bin\postgres.exe" --version >nul
if errorlevel 1 (
  echo FEHLER: Die mitgelieferte Datenbank startet auf diesem System nicht. Eventuell fehlt die
  echo "Microsoft Visual C++ Redistributable" (x64^). Siehe Anleitung, Abschnitt "Wenn etwas nicht klappt".
  exit /b 1
)
"%PY%" -c "import axentra; print('Installiert: Axentra', axentra.__version__, 'mit Axentra Studio.')"
if errorlevel 1 (
  echo FEHLER: Axentra startet nicht.
  exit /b 1
)
type nul > "%ENV_DIR%\.qa-kit-installed"
exit /b 0
