echo %0

.\tsc_list.ps1 build\tsc_types\*.d.ts > ./build/tsc_types/list.txt

pause
Get-ChildItem -Path "C:\files\*.txt" -Recurse |
Select @{Name="MB Size";Expression={ "{0:N1}" -f ($_.Length / 1MB) }}, Fullname, LastWriteTime;
pause
for /f "tokens=*" %a in ('dir *.d.ts /s /b') do echo %a
pause
