package com.exerceo.app

import android.webkit.JavascriptInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import org.json.JSONObject

class HealthConnectBridge(
    private val activity: MainActivity,
    private val scope: CoroutineScope,
) {
    @JavascriptInterface
    fun request(id: String, method: String, argsJson: String) {
        scope.launch {
            try {
                val args = if (argsJson.isBlank()) JSONObject() else JSONObject(argsJson)
                val payload = when (method) {
                    "getAvailability" -> activity.availabilityJson()
                    "requestPermissions" -> activity.requestHealthPermissions()
                    "readRange" -> activity.readHealthRange(
                        args.getString("startIso"),
                        args.getString("endIso"),
                    )
                    else -> throw IllegalArgumentException("Unknown method $method")
                }
                activity.resolveJs(id, payload)
            } catch (error: Exception) {
                activity.rejectJs(id, error.message ?: "Health Connect error")
            }
        }
    }
}
