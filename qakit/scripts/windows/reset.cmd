@echo off
rem Axentra Studio QA kit: delete the test data; the next start creates fresh synthetic test data.
setlocal
if not exist "%~dp0_kit\common.cmd" (
  echo FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  pause
  exit /b 1
)
call "%~dp0_kit\common.cmd"
chcp 65001 >nul
if not exist "%PY%" (
  echo Axentra Studio ist nicht installiert.
  goto :end
)
echo Zuruecksetzen loescht alle Testdaten (Datenbank, Dateien, abgefangene E-Mails).
echo Deine QA-Ergebnisse im Ordner "QA-Ergebnisse" und alte Sicherungen bleiben erhalten.
set "ANSWER="
set /p "ANSWER=Wirklich zuruecksetzen? (j/n) "
if /i not "%ANSWER%"=="j" if /i not "%ANSWER%"=="ja" if /i not "%ANSWER%"=="y" (
  echo Abgebrochen, nichts wurde geloescht.
  goto :end
)
set "ANSWER="
set /p "ANSWER=Vorher eine Sicherung anlegen? (j/n) "
if /i "%ANSWER%"=="j" goto :backup
if /i "%ANSWER%"=="ja" goto :backup
if /i "%ANSWER%"=="y" goto :backup
goto :reset
:backup
"%PY%" "%LAUNCHER%" backup
if errorlevel 1 (
  echo FEHLER: Die Sicherung ist fehlgeschlagen; es wurde nichts geloescht.
  goto :end
)
:reset
"%PY%" "%LAUNCHER%" reset
if errorlevel 1 (
  echo FEHLER: Zuruecksetzen ist fehlgeschlagen.
  goto :end
)
echo Weiter mit "2 - Starten".
:end
echo.
if not defined QA_KIT_NO_PAUSE pause
