# FORTUNES EDUTECH — Android App Module
This directory contains the **genuine native Android Studio project source files** for compiling the official, high-performance, signed Release APK for **FORTUNES EDUTECH**.

When users install this APK on their phone storage, it carries the **FORTUNES EDUTECH signature/branding**, bypasses "There was a problem parsing the package" error, and launches a fullscreen interactive view of the live, real-time platform.

---

## 🚀 How to Build & Sign the Release APK in 5 Minutes

Your developer can easily import this directory as a project in Android Studio, sign it, and obtain the release output file to distribute:

### 1. Open in Android Studio
1. Open **Android Studio**.
2. Go to **File > Open** (or selection screen).
3. Navigate to and select this `android-webview` directory.
4. Android Studio will automatically download the correct dependencies and synchronize the Gradle files!

### 2. Verify Config & Target URL
Check the `MainActivity.kt` file located at:  
`app/src/main/java/com/fortunes/edutech/MainActivity.kt`

It is configured to load the live, synchronizing production portal URL:  
`https://ais-pre-fxzp7ics24ajoz66yqxrkl-214670721133.europe-west2.run.app`

*(If your domain or link changes in the future, simply update this URL in `MainActivity.kt` and compile a new build!)*

### 3. Generate Signed Release APK
To ensure Android phones (like Samsung, Infinix, Tecno, Apple, etc.) accept the installation without "Parse errors" or blockages:
1. In the top menu, go to **Build > Generate Signed Bundle / APK...**
2. Select **APK** and click **Next**.
3. Choose/Create your secure cryptographic **Key store path** (keystore file), enter your passphrases, and alias.
4. Click **Next**, choose **release** build variant, check the `V4 (Resigned)` if supported or basic signature check toggles.
5. Click **Finish**.

### 4. Upload & Distribute
The generated signed file will be produced at:  
`app/release/app-release.apk`

Copy this file, rename it to `FORTUNES_EDUTECH.apk`, and upload it directly to your folder/server (`/public/FORTUNES_EDUTECH.apk`) to overwrite any template debug files!

---

## 📱 Alternate: 100% Zero-Latency Progressive Web App (PWA)

If you don't want to manage APK compiler files, the **Progressive Web App (PWA)** is fully set up and configured out-of-the-box!
1. Instruct users to switch to the **"Browser (PWA)"** tab on the download portal.
2. Tap **"Install with 1 Tap"** from their mobile web browsers.
3. This creates a high-resolution, operational **FORTUNES EDUTECH** launcher icon directly on their phone's home screen.
4. It behaves exactly like standard native storage apps, with full database support, offline caching, and instant login syncing!
