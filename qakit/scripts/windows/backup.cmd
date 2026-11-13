@echo off
rem Axentra Studio QA kit: copy the test data into the folder "Sicherungen" (stops Axentra Studio first).
setlocal
if not exist "%~dp0_kit\common.cmd" (
  echo FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  pause
  exit /b 1
)
call "%~dp0_kit\common.cmd"
chcp 65001 >nul
if not exist "%PY%" (
  echo Axentra Studio ist nicht installiert; es gibt nichts zu sichern.
  goto :end
)
echo Zum Sichern wird Axentra Studio beendet, falls es laeuft.
"%PY%" "%LAUNCHER%" backup
if errorlevel 1 echo FEHLER: Die Sicherung ist fehlgeschlagen.
:end
echo.
if not defined QA_KIT_NO_PAUSE pause
