#Requires -Version 7
$ErrorActionPreference = 'Stop'

$android = $PSScriptRoot
$repo = Split-Path $android -Parent
$localSecrets = Join-Path $android 'keystore.local.ps1'
if (Test-Path $localSecrets) {
  . $localSecrets
}

if (-not $env:ANDROID_KEYSTORE_FILE) {
  $defaultStore = Join-Path $env:USERPROFILE 'exerceo-release.jks'
  if (Test-Path $defaultStore) {
    $env:ANDROID_KEYSTORE_FILE = $defaultStore
  }
}

if (-not $env:ANDROID_KEYSTORE_FILE -or -not (Test-Path $env:ANDROID_KEYSTORE_FILE)) {
  throw "Set ANDROID_KEYSTORE_FILE or create android/keystore.local.ps1."
}
if (-not $env:ANDROID_KEYSTORE_PASSWORD -or -not $env:ANDROID_KEY_ALIAS -or -not $env:ANDROID_KEY_PASSWORD) {
  throw "Set ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, and ANDROID_KEY_PASSWORD."
}

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  throw "adb is not on PATH. Install Android platform-tools and try again."
}

$webUrl = 'https://exerceo.covium.tech/android/www/index.html'
$frontend = Join-Path $repo 'frontend'
Push-Location $frontend
try {
  npm run android:copy
} finally {
  Pop-Location
}

Push-Location $android
try {
  & (Join-Path $android 'gradlew.bat') :app:assembleDebug "-PexerceoWebUrl=$webUrl"
} finally {
  Pop-Location
}

$apk = Join-Path $android 'app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apk)) {
  throw "APK was not produced: $apk"
}

adb install -r -d $apk
Write-Output "Installed $apk"
