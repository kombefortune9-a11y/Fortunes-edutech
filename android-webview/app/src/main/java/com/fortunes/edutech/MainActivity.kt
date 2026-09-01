package com.fortunes.edutech

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var myWebView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        // Switch back to the normal app theme before creating the activity window
        setTheme(R.style.AppTheme)
        super.onCreate(savedInstanceState)
        
        // Initialize dynamic, full-screen WebView container
        myWebView = WebView(this)
        setContentView(myWebView)

        val webSettings: WebSettings = myWebView.settings
        
        // Enable standard web features to support React, local storage, state management, and custom scripts
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true
        
        // Prevent external web browsers (like Chrome or Samsung Internet) from hijacking system links!
        myWebView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                view?.loadUrl(url ?: return false)
                return true
            }
        }
        
        // Dynamically loads the real-time FORTUNES EDUTECH production server.
        // It opens directly to the secure Login and CBC-scheme dashboards.
        myWebView.loadUrl("https://ais-pre-fxzp7ics24ajoz66yqxrkl-214670721133.europe-west2.run.app")
    }

    // Handles the Android hardware back button so it moves backwards in the portal draft history
    // instead of instantly killing the application!
    override fun onBackPressed() {
        if (myWebView.canGoBack()) {
            myWebView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
