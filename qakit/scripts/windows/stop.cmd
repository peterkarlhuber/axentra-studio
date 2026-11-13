@echo off
rem Axentra Studio QA kit: stop Studio, Axentra and the database.
setlocal
if not exist "%~dp0_kit\common.cmd" (
  echo FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken.
  pause
  exit /b 1
)
call "%~dp0_kit\common.cmd"
chcp 65001 >nul
if exist "%PY%" (
  "%PY%" "%LAUNCHER%" stop
) else (
  echo Axentra Studio ist nicht installiert.
)
echo.
if not defined QA_KIT_NO_PAUSE pause
