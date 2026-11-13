@rem Shared settings of the Axentra Studio QA kit (Windows). Called by the scripts; not run directly.
@rem Everything the kit installs or writes stays inside this folder.
set "KIT_ROOT=%~dp0.."
for %%I in ("%KIT_ROOT%") do set "KIT_ROOT=%%~fI"
set "KIT=%KIT_ROOT%\_kit"
set "ENV_DIR=%KIT%\env"
set "PY=%ENV_DIR%\Scripts\python.exe"
set "LAUNCHER=%KIT%\app\launcher.py"
set "UV=%KIT%\bin\windows-x64\uv.exe"
rem Settings of a uv or Python the user may have configured elsewhere must not redirect the kit.
for %%V in (UV_INDEX UV_INDEX_URL UV_DEFAULT_INDEX UV_EXTRA_INDEX_URL UV_FIND_LINKS UV_PYTHON_INSTALL_MIRROR UV_PYPY_INSTALL_MIRROR UV_PYTHON_DOWNLOADS_JSON_URL UV_PYTHON_DOWNLOADS UV_OFFLINE UV_CONSTRAINT UV_OVERRIDE UV_PYTHON UV_INSECURE_HOST PIP_INDEX_URL PIP_EXTRA_INDEX_URL PYTHONPATH PYTHONHOME AXENTRA_CONFIG) do set "%%V="
set "UV_CACHE_DIR=%KIT%\cache"
set "UV_PYTHON_INSTALL_DIR=%KIT%\python"
set "UV_NO_CONFIG=1"
set "UV_NO_PROGRESS=1"
set "PYTHONUTF8=1"
if not defined UV_PYTHON_PREFERENCE set "UV_PYTHON_PREFERENCE=only-managed"
