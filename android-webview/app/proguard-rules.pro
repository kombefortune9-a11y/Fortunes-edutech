# Proguard rules for com.fortunes.edutech
# Keep WebView and JavaScript interfaces secure across minify obfuscations

-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(***);
}
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(***);
}
-dontwarn android.webkit.**
-keepattributes JavascriptInterface
