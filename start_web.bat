@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "VENV_PY=%ROOT%venv\Scripts\python.exe"

pushd "%ROOT%"

call :find_python
if errorlevel 1 goto :fail

call :find_uv
if errorlevel 1 goto :fail

call :ensure_backend_env
if errorlevel 1 goto :fail

call :ensure_frontend_env
if errorlevel 1 goto :fail

call :load_backend_env
if errorlevel 1 goto :fail

echo.
echo Starting OpenDraft backend and frontend...
echo.

start "OpenDraft Backend" cmd /k "cd /d ""%ROOT%backend"" && ""%VENV_PY%"" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8008"
start "OpenDraft Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev -- --host 0.0.0.0 --port 5173"

call :wait_for_backend

timeout /t 2 /nobreak >nul
start "" http://localhost:5173

echo.
echo OpenDraft is starting.
echo Frontend: http://localhost:5173
echo Backend:   http://localhost:8008
echo.
echo Leave the two console windows open while you use the app.
echo.
popd
exit /b 0

:wait_for_backend
for /l %%I in (1,1,20) do (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8008/health -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
    if not errorlevel 1 (
        exit /b 0
    )
    timeout /t 1 /nobreak >nul
)

echo.
echo Warning: backend did not become reachable at http://127.0.0.1:8008/health.
echo Keep the backend terminal open and check it for startup errors.
echo.
exit /b 0

:find_uv
where uv >nul 2>nul
if errorlevel 1 (
    echo uv was not found on PATH.
    echo Install uv from https://docs.astral.sh/uv/getting-started/installation/
    echo Then open a new terminal and run this launcher again.
    exit /b 1
)
exit /b 0

:load_backend_env
set "BACKEND_ENV=%ROOT%backend\.env"
if not exist "%BACKEND_ENV%" (
    echo backend\.env was not found.
    echo Create backend\.env with AI_PROVIDER_MODEL and API keys to enable real AI generation.
    exit /b 0
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%BACKEND_ENV%") do (
    if not "%%~A"=="" set "%%~A=%%~B"
)
exit /b 0

:find_python
set "PYTHON_CMD="

where py >nul 2>nul
if not errorlevel 1 (
    py -3.12 --version >nul 2>nul && set "PYTHON_CMD=py -3.12"
)

if not defined PYTHON_CMD (
    where py >nul 2>nul
    if not errorlevel 1 (
        py -3.11 --version >nul 2>nul && set "PYTHON_CMD=py -3.11"
    )
)

if not defined PYTHON_CMD (
    where py >nul 2>nul
    if not errorlevel 1 (
        py -3.10 --version >nul 2>nul && set "PYTHON_CMD=py -3.10"
    )
)

if not defined PYTHON_CMD (
    where python >nul 2>nul && call :verify_python python
)

if not defined PYTHON_CMD (
    echo Python 3.10, 3.11, or 3.12 was not found on PATH.
    echo This launcher does not support Python 3.13+ because the backend
    echo dependencies used by OpenDraft do not yet ship wheels for it.
    echo Install Python 3.12 and make sure it is available from a new terminal.
    exit /b 1
)

exit /b 0

:verify_python
set "PY_VERSION="
for /f "tokens=2" %%V in ('%~1 --version 2^>^&1') do set "PY_VERSION=%%V"

if not defined PY_VERSION exit /b 1

set "PY_MAJOR_MINOR=%PY_VERSION:~0,4%"
if "%PY_MAJOR_MINOR%"=="3.10" set "PYTHON_CMD=%~1"
if "%PY_MAJOR_MINOR%"=="3.11" set "PYTHON_CMD=%~1"
if "%PY_MAJOR_MINOR%"=="3.12" set "PYTHON_CMD=%~1"
exit /b 0

:ensure_backend_env
set "VENV_VERSION="

if not exist "%ROOT%venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    call %PYTHON_CMD% -m venv "%ROOT%venv" || exit /b 1
)

if exist "%VENV_PY%" (
    for /f "tokens=2" %%V in ('"%VENV_PY%" --version 2^>^&1') do set "VENV_VERSION=%%V"
)

if defined VENV_VERSION (
    set "VENV_MAJOR_MINOR=%VENV_VERSION:~0,4%"
    set "NEEDS_RECREATE=1"
    if "%VENV_MAJOR_MINOR%"=="3.10" set "NEEDS_RECREATE=0"
    if "%VENV_MAJOR_MINOR%"=="3.11" set "NEEDS_RECREATE=0"
    if "%VENV_MAJOR_MINOR%"=="3.12" set "NEEDS_RECREATE=0"
    if "%NEEDS_RECREATE%"=="1" (
        echo Existing virtual environment uses Python %VENV_VERSION%.
        echo Recreating it with a supported interpreter...
        rmdir /s /q "%ROOT%venv"
        call %PYTHON_CMD% -m venv "%ROOT%venv" || exit /b 1
    )
)

if not exist "%VENV_PY%" (
    echo Failed to create the Python virtual environment.
    exit /b 1
)

set "DEPS_STAMP=%ROOT%venv\.deps_ready"
if exist "%DEPS_STAMP%" goto :deps_ready

powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*OpenDraft*' -and $_.CommandLine -like '*\\venv\\Scripts\\python.exe*' }; if ($p) { exit 0 } else { exit 1 }" >nul 2>nul
if not errorlevel 1 goto :deps_ready

"%VENV_PY%" -c "import uvicorn, fastapi, pydantic_core" >nul 2>nul
if not errorlevel 1 goto :deps_ready

echo Installing backend dependencies...
uv pip install --python "%VENV_PY%" -r "%ROOT%backend\requirements.txt" || exit /b 1
type nul > "%DEPS_STAMP%"

:deps_ready
exit /b 0

:ensure_frontend_env
if not exist "%ROOT%frontend\node_modules\" (
    echo Installing frontend dependencies...
    pushd "%ROOT%frontend"
    call npm install || exit /b 1
    popd
)
exit /b 0

:fail
echo.
echo OpenDraft launcher failed.
echo Fix the error above, then run this file again.
echo.
popd
exit /b 1