package com.exerceo.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.Main + job)
    private lateinit var webView: WebView
    private var healthManager: HealthConnectManager? = null
    private var permissionWaiter: CompletableDeferred<Boolean>? = null

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract(),
    ) { granted ->
        val manager = healthManager
        permissionWaiter?.complete(manager != null && granted.containsAll(manager.permissions))
        permissionWaiter = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        setContentView(R.layout.activity_main)
        WebView.setWebContentsDebuggingEnabled(true)
        webView = findViewById(R.id.webView)
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.updatePadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("exerceo.covium.tech")
            .addPathHandler("/android/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }
        webView.addJavascriptInterface(HealthConnectBridge(this, scope), "ExerceoNative")
        prepareHealthConnect()
        webView.loadUrl(BuildConfig.WEB_URL)
    }

    override fun onDestroy() {
        job.cancel()
        super.onDestroy()
    }

    fun availabilityJson(): String {
        val status = when (HealthConnectClient.getSdkStatus(this)) {
            HealthConnectClient.SDK_AVAILABLE -> "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "install"
            else -> "unavailable"
        }
        return JSONObject().put("status", status).toString()
    }

    suspend fun requestHealthPermissions(): String {
        val manager = healthManager
            ?: run {
                prepareHealthConnect()
                healthManager
            }
            ?: return JSONObject().put("granted", false).toString()
        if (manager.hasPermissions()) {
            return JSONObject().put("granted", true).toString()
        }
        val waiter = CompletableDeferred<Boolean>()
        permissionWaiter = waiter
        permissionLauncher.launch(manager.permissions)
        val granted = waiter.await()
        return JSONObject().put("granted", granted).toString()
    }

    suspend fun readHealthRange(startIso: String, endIso: String): String {
        val manager = healthManager ?: throw IllegalStateException("Health Connect unavailable")
        return withContext(Dispatchers.IO) {
            manager.readRange(startIso, endIso).toString()
        }
    }

    fun resolveJs(id: String, payloadJson: String) {
        scope.launch {
            val encoded = JSONObject.quote(payloadJson)
            webView.evaluateJavascript("window.__exerceoResolve && window.__exerceoResolve('$id', $encoded);", null)
        }
    }

    fun rejectJs(id: String, message: String) {
        scope.launch {
            val encoded = JSONObject.quote(message)
            webView.evaluateJavascript("window.__exerceoReject && window.__exerceoReject('$id', $encoded);", null)
        }
    }

    private fun prepareHealthConnect() {
        val status = HealthConnectClient.getSdkStatus(this)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            return
        }
        val client = HealthConnectClient.getOrCreate(this)
        healthManager = HealthConnectManager(client)
    }
}
