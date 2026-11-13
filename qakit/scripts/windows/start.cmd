@echo off
rem Axentra Studio QA kit: start the database, Axentra and Studio, and open the browser.
setlocal
if not exist "%~dp0_kit\common.cmd" (
  echo FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  pause
  exit /b 1
)
call "%~dp0_kit\common.cmd"
chcp 65001 >nul
title Axentra Studio (lokale Testversion)
if exist "%ENV_DIR%\.qa-kit-installed" goto :run
call "%KIT%\install_steps.cmd"
if errorlevel 1 goto :failed
echo.
:run
echo Axentra Studio startet. Dieses Fenster bitte offen lassen, solange du testest.
echo Beenden: "3 - Beenden" oder dieses Fenster schliessen.
echo.
"%PY%" "%LAUNCHER%" start
if errorlevel 1 goto :failed
echo.
echo Axentra Studio wurde beendet.
echo.
if not defined QA_KIT_NO_PAUSE pause
exit /b 0
:failed
echo.
echo Axentra Studio wurde mit einem Fehler beendet.
echo.
if not defined QA_KIT_NO_PAUSE pause
exit /b 1
