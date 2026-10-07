# Emberwise - GitHub'a tek adimda yayinla
#
#  1. GitHub CLI ile giris yapar (tarayicida "Authorize" demen yeterli)
#  2. github.com/anilg12/Emberwise deposunu olusturur ve kodu yukler
#  3. v1.0.0 etiketini gonderir -> GitHub Actions Windows + macOS (M1-M5 ve Intel) kurulumlarini derler
#  4. Bu bilgisayarda derlenen Windows kurulumunu hemen Release'e ekler
#  5. Eski Odak-Menajeri-RPG deposunun README'sine yeni projeye giden bir not ekler (hicbir sey silinmez)
#
# Calistirma:  YAYINLA.cmd dosyasina cift tikla
#         ya da:  powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1
#
# Pencere is bitince (ya da bir hata olursa) acik kalir; her adim publish-log.txt dosyasina da yazilir.

# git/gh hata verince exception atmiyor, exit code'lari asagida kendim kontrol ediyorum
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
$log = Join-Path $PSScriptRoot 'publish-log.txt'
try { Start-Transcript -Path $log -Force | Out-Null } catch { }

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Yellow }
function Fail($msg) { throw $msg }

try {
  $Owner   = 'anilg12'
  $Repo    = 'Emberwise'
  $Version = (Get-Content package.json -Raw | ConvertFrom-Json).version
  $Tag     = "v$Version"
  $Exe     = "release\Emberwise-Setup.exe"

  Step 'Araclar kontrol ediliyor'
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail 'Git bulunamadi. Kur: winget install Git.Git' }
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Fail 'GitHub CLI bulunamadi. Kur: winget install GitHub.cli' }
  if (-not (Test-Path '.git')) { Fail 'Bu klasor bir git deposu degil (.git yok).' }
  Write-Host 'git ve gh hazir.'

  Step 'GitHub girisi kontrol ediliyor'
  gh auth status *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'Birazdan bir kod gorunecek. Enter''a basinca tarayici acilir;' -ForegroundColor Cyan
    Write-Host 'kodu yapistir, "Continue" ve sonra yesil "Authorize github" butonuna bas.' -ForegroundColor Cyan
    Write-Host ''
    gh auth login --hostname github.com --git-protocol https --web --scopes 'repo,workflow'
    if ($LASTEXITCODE -ne 0) { Fail 'GitHub girisi tamamlanamadi. Tekrar dene.' }
  }
  gh auth setup-git *> $null
  $me = gh api user --jq .login
  Write-Host "Giris yapildi: $me" -ForegroundColor Green

  Step "Depo hazirlaniyor: $Owner/$Repo"
  gh repo view "$Owner/$Repo" *> $null
  if ($LASTEXITCODE -ne 0) {
    gh repo create "$Owner/$Repo" --public `
      --description 'Emberwise - a cozy focus RPG for Windows & macOS. Turn tasks into quests and focus into XP. Offline, Turkish & English.' `
      --homepage "https://github.com/$Owner/$Repo/releases/latest"
    if ($LASTEXITCODE -ne 0) { Fail 'Depo olusturulamadi.' }
  } else {
    Write-Host 'Depo zaten var, kullaniliyor.'
  }
  $remotes = @(git remote)
  if ($remotes -notcontains 'origin') { git remote add origin "https://github.com/$Owner/$Repo.git" }
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { Fail 'Kod GitHub''a gonderilemedi (git push).' }
  gh repo edit "$Owner/$Repo" --add-topic productivity --add-topic pomodoro --add-topic gamification --add-topic rpg --add-topic focus --add-topic electron --add-topic svelte --add-topic offline --add-topic windows --add-topic macos *> $null

  Step "$Tag etiketi gonderiliyor (Windows + macOS derlemesi baslar)"
  $tags = @(git tag)
  if ($tags -notcontains $Tag) { git tag -a $Tag -m "Emberwise $Version" }
  git push origin $Tag
  if ($LASTEXITCODE -ne 0) { Fail 'Etiket gonderilemedi (git push tag).' }

  Step 'Release olusturuluyor'
  $notes = @"
## Emberwise $Version

**Windows:** ``Emberwise-Setup.exe`` dosyasini indir ve calistir - kendiliginden kurulur ve acilir.
**macOS (M1-M5 ve sonrasi):** ``Emberwise-mac-arm64.dmg`` dosyasini indir, Emberwise'i Applications klasorune surukle. Intel Mac icin ``Emberwise-mac-x64.dmg``.
macOS dosyalari GitHub Actions tarafindan birkac dakika icinde bu sayfaya eklenir.

Ilk acilista macOS: sag tik -> Ac (veya Sistem Ayarlari -> Gizlilik ve Guvenlik -> Yine de Ac).

Tamamen cevrimdisi - Turkce & English - Aydinlik & koyu tema - Anil Gul imzasiyla
"@
  gh release view $Tag --repo "$Owner/$Repo" *> $null
  if ($LASTEXITCODE -ne 0) {
    if (Test-Path $Exe) { gh release create $Tag $Exe --repo "$Owner/$Repo" --title "Emberwise $Version" --notes $notes --verify-tag }
    else { gh release create $Tag --repo "$Owner/$Repo" --title "Emberwise $Version" --notes $notes --verify-tag }
    if ($LASTEXITCODE -ne 0) { Write-Host 'Release olusturulamadi; GitHub Actions derleme bitince olusturacak.' -ForegroundColor DarkYellow }
  } elseif (Test-Path $Exe) {
    gh release upload $Tag $Exe --repo "$Owner/$Repo" --clobber
  }

  Step 'Eski Odak-Menajeri-RPG README dosyasina yeni proje notu ekleniyor'
  $tmp = Join-Path $env:TEMP ('odak-menajeri-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
  git clone --depth 1 "https://github.com/$Owner/Odak-Menajeri-RPG.git" $tmp
  $readme = Join-Path $tmp 'README.md'
  if (Test-Path $readme) {
    $current = [IO.File]::ReadAllText($readme, [Text.Encoding]::UTF8)
    if ($current -notmatch 'github.com/anilg12/Emberwise') {
      $note = "> **Bu proje yeniden dogdu: [Emberwise](https://github.com/$Owner/$Repo)** - Windows ve macOS icin bastan tasarlanan, cevrimdisi calisan yeni surum. [Indir](https://github.com/$Owner/$Repo/releases/latest)`n`n"
      [IO.File]::WriteAllText($readme, $note + $current, (New-Object Text.UTF8Encoding $false))
      Push-Location $tmp
      git add README.md
      git commit -m 'README: link to Emberwise, the new version of this project'
      git push
      Pop-Location
    } else {
      Write-Host 'Not zaten ekli.'
    }
  }
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue

  Step 'Bitti!'
  Write-Host "Depo:     https://github.com/$Owner/$Repo" -ForegroundColor Green
  Write-Host "Derleme:  https://github.com/$Owner/$Repo/actions" -ForegroundColor Green
  Write-Host "Indirme:  https://github.com/$Owner/$Repo/releases/latest" -ForegroundColor Green
}
catch {
  Write-Host ''
  Write-Host "HATA: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Ayrintilar: $log" -ForegroundColor Red
}
finally {
  try { Stop-Transcript | Out-Null } catch { }
  Write-Host ''
  Read-Host 'Kapatmak icin Enter''a bas'
}
