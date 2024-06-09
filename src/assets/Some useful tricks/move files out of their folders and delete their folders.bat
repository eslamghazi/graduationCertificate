@echo off
setlocal enabledelayedexpansion

REM Loop through all directories in the current directory
for /d %%D in (*) do (
    REM Change into the directory
    cd "%%D"
    
    REM Loop through all files in the directory (assuming only one file per directory)
    for %%F in (*) do (
        REM Move the file to the parent directory
        move "%%F" "..\%%F"
    )
    
    REM Change back to the parent directory
    cd ..
    
    REM Remove the directory
    rd "%%D"
)

endlocal
echo All files have been moved to the parent directory and folders have been deleted.
pause
