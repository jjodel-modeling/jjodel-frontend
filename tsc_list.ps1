# check for arguments
if (!$args) { echo "Please specify [path\]filespec. i.e., c:\temp\*.txt or *.txt"; return }
# get the path only
$path = Split-Path $Args  | Where-Object {$_ -ne ''}| Convert-Path
# if no path was specified, use the current directory
$path = IF ([string]::IsNullOrWhitespace($path)){ $pwd.path } else { $path }
# get the filespec (*.txt)
$filespec = Split-Path $Args -Leaf
write-output "`nShowing all $filespec contained under $path"
Get-ChildItem -Path $path -Filter $filespec -File -Recurse |
Format-Table -Wrap @{ Name="File"; Expression = { ($_.FullName -ireplace [regex]::Escape($path), "").TrimStart("\") }}#,
    #@{ Name="Date"; Expression = { $_.LastWriteTime.ToString("MM/dd/yyyy  hh:mm:ss  ") }},
    #@{ Name="Size"; Expression = { "{0,15:N0}" -f $_.Length }; Alignment="right"; }
