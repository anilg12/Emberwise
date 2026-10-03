# Emberwise - GitHub'a tek adimda yayinla
#
#  1. GitHub CLI ile giris yapar (tarayicida "Authorize" demen yeterli)
#  2. github.com/anilg12/Emberwise deposunu olusturur ve kodu yukler
#  3. v1.0.0 etiketini gonderir -> GitHub Actions Windows + macOS (M1-M5 ve Intel) kurulumlarini derler
#  4. Bu bilgisayarda derlenen Windows kurulumunu hemen Release'e ekler
#  5. Eski Odak-Menajeri-RPG deposunun README'sine yeni projeye giden bir not ekler (hicbir sey silinmez)
#
# Calistirma:  sag tik -> "PowerShell ile calistir"
#         ya da:  powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1

# Native tools (git, gh) report through exit codes; we check those explicitly below.
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

$Owner   = 'anilg12'
$Repo    = 'Emberwise'
$Version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$Tag     = "v$Version"
$Exe     = "release\Emberwise-Setup-$Version.exe"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Yellow }

Step 'GitHub girisi kontrol ediliyor'
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Tarayicida acilan sayfada kodu onayla ve "Authorize github" de.' -ForegroundColor Cyan
  gh auth login --hostname github.com --git-protocol https --web --scopes 'repo,workflow'
  if ($LASTEXITCODE -ne 0) { throw 'GitHub girisi tamamlanamadi.' }
}
gh auth setup-git

Step "Depo hazirlaniyor: $Owner/$Repo"
gh repo view "$Owner/$Repo" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gh repo create "$Owner/$Repo" --public `
    --description 'Emberwise - a cozy focus RPG for Windows & macOS. Turn tasks into quests and focus into XP. Offline, Turkish & English.' `
    --homepage "https://github.com/$Owner/$Repo/releases/latest"
}
$remotes = git remote
if ($remotes -notcontains 'origin') { git remote add origin "https://github.com/$Owner/$Repo.git" }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'Kod GitHub''a gonderilemedi (git push).' }
gh repo edit "$Owner/$Repo" --add-topic productivity --add-topic pomodoro --add-topic gamification --add-topic rpg --add-topic focus --add-topic electron --add-topic svelte --add-topic offline --add-topic windows --add-topic macos 2>$null | Out-Null

Step "$Tag etiketi gonderiliyor (Windows + macOS derlemesi baslar)"
$tags = git tag
if ($tags -notcontains $Tag) { git tag -a $Tag -m "Emberwise $Version" }
git push origin $Tag
if ($LASTEXITCODE -ne 0) { throw 'Etiket gonderilemedi (git push tag).' }

Step 'Release olusturuluyor'
$notes = @"
## Emberwise $Version

**Windows:** ``Emberwise-Setup-$Version.exe`` dosyasini indir ve calistir - kendiliginden kurulur ve acilir.
**macOS (M1-M5 ve sonrasi):** ``mac-arm64.dmg`` dosyasini indir, Emberwise'i Applications klasorune surukle. Intel Mac icin ``mac-x64``.
macOS dosyalari GitHub Actions tarafindan birkac dakika icinde bu sayfaya eklenir.

Ilk acilista macOS: sag tik -> Ac (veya Sistem Ayarlari -> Gizlilik ve Guvenlik -> Yine de Ac).

Tamamen cevrimdisi - Turkce & English - Aydinlik & koyu tema - Anil Gul imzasiyla
"@
gh release view $Tag --repo "$Owner/$Repo" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  if (Test-Path $Exe) { gh release create $Tag $Exe --repo "$Owner/$Repo" --title "Emberwise $Version" --notes $notes --verify-tag }
  else { gh release create $Tag --repo "$Owner/$Repo" --title "Emberwise $Version" --notes $notes --verify-tag }
} elseif (Test-Path $Exe) {
  gh release upload $Tag $Exe --repo "$Owner/$Repo" --clobber
}

Step 'Eski Odak-Menajeri-RPG README dosyasina yeni proje notu ekleniyor'
$tmp = Join-Path $env:TEMP ("odak-menajeri-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
git clone --depth 1 "https://github.com/$Owner/Odak-Menajeri-RPG.git" $tmp
$readme = Join-Path $tmp 'README.md'
$current = [IO.File]::ReadAllText($readme, [Text.Encoding]::UTF8)
if ($current -notmatch 'github.com/anilg12/Emberwise') {
  $note = "> **Bu proje yeniden dogdu: [Emberwise](https://github.com/$Owner/$Repo)** - Windows ve macOS icin bastan tasarlanan, cevrimdisi calisan yeni surum. [Indir](https://github.com/$Owner/$Repo/releases/latest)`n`n"
  [IO.File]::WriteAllText($readme, $note + $current, (New-Object Text.UTF8Encoding $false))
  Push-Location $tmp
  git add README.md
  git commit -m 'README: link to Emberwise, the new version of this project'
  git push
  Pop-Location
}
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue

Step 'Bitti!'
Write-Host "Depo:     https://github.com/$Owner/$Repo"
Write-Host "Derleme:  https://github.com/$Owner/$Repo/actions"
Write-Host "Indirme:  https://github.com/$Owner/$Repo/releases/latest"
