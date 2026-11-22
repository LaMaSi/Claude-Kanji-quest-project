# Android app (APK)

The game is the same web code, wrapped with Capacitor (`android/`). No store, no server.

## Build (any machine with JDK 21 + Android SDK 35)
    npm install
    node tools/build-www.mjs        # copies the web app into www/
    npx cap sync android
    cd android && ./gradlew assembleRelease     # -> android/app/build/outputs/apk/release/app-release.apk

Before every release: bump `versionCode` (must grow) and `versionName` in `android/app/build.gradle`.
Set `sdk.dir` in `android/local.properties` and the signing key in `android/keystore.properties` (neither is committed).

## Signing key – keep it safe, outside git
Android only installs an update over an existing app if it was signed with the SAME key. The key file `wolfsdorf.jks` is NOT in this repo.
Keep a copy (e.g. cloud drive). `android/keystore.properties` points to it:

    storeFile=/path/to/wolfsdorf.jks
    storePassword=...
    keyAlias=wolfsdorf
    keyPassword=...

If the key is lost, the app must be uninstalled before a new one can be installed (the local save is lost).

## Install
Send the APK by WhatsApp; the receiver opens it and allows "install from this source". Updates install over the old version and keep the save.

## Reminder
Menu → "Tägliche Erinnerung": one local notification per day at the chosen time (needs notification permission on Android 13+).
