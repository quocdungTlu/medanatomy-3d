# Windows PowerShell: .\pull_all.ps1 you@example.com
param([Parameter(Mandatory=$true)][string]$Mail)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
python -m src.collect_refs --mailto $Mail
python -m src.collect_openalex --mailto $Mail
python -m src.fetch_wikipedia
python -m src.rank_refs --top 3
Write-Host "Xong. Mo data\shortlist.md, chon DOI vao selected.json roi: python -m src.build_sources $Mail"
