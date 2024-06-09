@echo off
setlocal enabledelayedexpansion

rem Get the directory of the batch file
set "batchDir=%~dp0"

rem Change to the directory where the batch file is located
cd /d "%batchDir%"

rem Iterate over all files in the directory
for %%f in (*.*) do (
    rem Remove spaces from the filename
    set "newfilename=%%f"
    ren "%%f" "!newfilename: =!"
)

rem Pause to keep the command prompt window open
pause >nul