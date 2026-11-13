@echo off
rem Axentra Studio QA kit: install Python and the libraries into this folder (needs internet once).
setlocal
if not exist "%~dp0_kit\common.cmd" (
  echo FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  pause
  exit /b 1
)
call "%~dp0_kit\common.cmd"
chcp 65001 >nul
if exist "%PY%" "%PY%" "%LAUNCHER%" stop >nul 2>&1
call "%KIT%\install_steps.cmd"
if errorlevel 1 goto :failed
echo.
echo Weiter mit "2 - Starten".
echo.
if not defined QA_KIT_NO_PAUSE pause
exit /b 0
:failed
echo.
if not defined QA_KIT_NO_PAUSE pause
exit /b 1
