@echo off
setlocal enabledelayedexpansion

REM Loop through all directories in the current directory
for /d %%D in (*) do (
    REM Change into the directory
    cd "%%D"
    
    REM Loop through all files in the directory (assuming only one file per directory)
    for %%F in (*) do (
        REM Get the file extension
        set "ext=%%~xF"
        
        REM Rename the file to match the directory name with the original extension
        ren "%%F" "%%D!ext!"
    )
    
    REM Change back to the parent directory
    cd ..
)

endlocal
echo All files have been renamed to match their directory names.
pause