#Requires -Version 7
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

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

function Get-InstalledVersionCode {
  $previous = $PSNativeCommandUseErrorActionPreference
  $PSNativeCommandUseErrorActionPreference = $false
  try {
    $dump = adb shell dumpsys package com.exerceo.app 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $dump) {
      return 0
    }
    $match = [regex]::Match(($dump | Out-String), 'versionCode=(\d+)')
    if ($match.Success) {
      return [int]$match.Groups[1].Value
    }
    return 0
  } finally {
    $PSNativeCommandUseErrorActionPreference = $previous
  }
}

function Stop-GradleDaemons {
  $gradlew = Join-Path $android 'gradlew.bat'
  $previous = $PSNativeCommandUseErrorActionPreference
  $PSNativeCommandUseErrorActionPreference = $false
  try {
    & $gradlew --stop
  } finally {
    $PSNativeCommandUseErrorActionPreference = $previous
  }
}

$webUrl = 'https://exerceo.covium.tech/android/www/index.html'
$versionCode = [Math]::Max((Get-InstalledVersionCode) + 1, 1)
$buildDir = Join-Path $env:LOCALAPPDATA 'exerceo\android-app-build'
Write-Output "Using versionCode $versionCode"
Write-Output "Using build directory $buildDir"

$frontend = Join-Path $repo 'frontend'
Push-Location $frontend
try {
  npm run android:copy
} finally {
  Pop-Location
}

Stop-GradleDaemons

Push-Location $android
try {
  & (Join-Path $android 'gradlew.bat') --no-daemon :app:assembleDebug `
    "-PexerceoWebUrl=$webUrl" `
    "-PexerceoVersionCode=$versionCode" `
    "-PexerceoAndroidBuildDir=$buildDir"
} finally {
  Pop-Location
}

$apk = Join-Path $buildDir 'outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apk)) {
  throw "APK was not produced: $apk"
}

adb install -r $apk
Write-Output "Installed $apk (versionCode $versionCode)"
