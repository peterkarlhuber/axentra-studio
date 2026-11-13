@echo off
rem Axentra Studio QA kit: stop everything and remove what the kit installed or wrote into this folder
rem (Python, libraries, test data). Backups and QA results stay until you delete the folder.
setlocal
if not exist "%~dp0_kit\common.cmd" (
  echo FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  pause
  exit /b 1
)
call "%~dp0_kit\common.cmd"
chcp 65001 >nul
echo Deinstallieren beendet Axentra Studio und entfernt Python, die Bibliotheken und die Testdaten
echo aus diesem Ordner: "%KIT_ROOT%"
echo Ausserhalb dieses Ordners wurde nichts installiert oder veraendert.
set "ANSWER="
set /p "ANSWER=Fortfahren? (j/n) "
if /i not "%ANSWER%"=="j" if /i not "%ANSWER%"=="ja" if /i not "%ANSWER%"=="y" (
  echo Abgebrochen, nichts wurde entfernt.
  goto :end
)
if not defined KIT goto :badkit
if not exist "%KIT%\common.cmd" goto :badkit
if not exist "%KIT%\app\launcher.py" goto :badkit
if not exist "%PY%" goto :nopython
if not exist "%KIT%\daten" goto :cleanup
set "ANSWER="
set /p "ANSWER=Vorher die Testdaten sichern (Ordner Sicherungen)? (j/n) "
if /i "%ANSWER%"=="j" goto :backup
if /i "%ANSWER%"=="ja" goto :backup
if /i "%ANSWER%"=="y" goto :backup
goto :cleanup
:backup
"%PY%" "%LAUNCHER%" backup
if errorlevel 1 (
  echo FEHLER: Die Sicherung ist fehlgeschlagen; es wurde nichts entfernt.
  goto :end
)
:cleanup
"%PY%" "%LAUNCHER%" cleanup
if errorlevel 1 (
  echo FEHLER: Axentra Studio konnte nicht beendet werden; es wurde nichts entfernt.
  goto :end
)
goto :remove
:nopython
if exist "%KIT%\daten\pg\postmaster.pid" "%KIT%\pg\bin\pg_ctl.exe" stop -D "%KIT%\daten\pg" -m fast -w >nul 2>&1
:remove
for %%D in ("%KIT%\env" "%KIT%\python" "%KIT%\cache" "%KIT%\daten") do if exist "%%~D" rmdir /s /q "%%~D"
for %%D in ("%KIT%\env" "%KIT%\python" "%KIT%\cache" "%KIT%\daten") do if exist "%%~D" (
  echo FEHLER: Der Ordner %%~D konnte nicht vollstaendig entfernt werden. Bitte "3 - Beenden" ausfuehren und erneut versuchen.
  goto :end
)
echo.
echo Entfernt. Zum Schluss den Ordner in den Papierkorb ziehen (vorher die Ordner
echo "Sicherungen" und "QA-Ergebnisse" woanders hin kopieren, falls du sie behalten willst).
goto :end
:badkit
echo FEHLER: Unerwarteter Ordner, es wurde nichts entfernt.
:end
echo.
if not defined QA_KIT_NO_PAUSE pause
