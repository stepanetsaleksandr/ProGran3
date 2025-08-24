@echo off
set GIT_PAGER=
git reset --hard 5bf3ce2
echo.
echo Reset completed. Current commit:
git --no-pager log --oneline -1
pause
