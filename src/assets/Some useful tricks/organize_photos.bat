@echo off
setlocal enabledelayedexpansion

REM Set the directory containing your photos
set "photos_directory=.\"

REM Loop through each file in the directory
for %%F in ("%photos_directory%\*") do (
    REM Check if the file is a photo
    if /I "%%~xF"==".jpg" (
        REM Extract the filename without extension
        set "filename=%%~nF"
        REM Create a folder with the filename (if not exists)
        if not exist "!photos_directory!\!filename!" mkdir "!photos_directory!\!filename!"
        REM Move the photo into the folder
        move "%%F" "!photos_directory!\!filename!"
    )
)

echo Photos organized and renamed successfully!
pause