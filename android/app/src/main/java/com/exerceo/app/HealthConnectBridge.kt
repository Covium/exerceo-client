package com.exerceo.app

import android.util.Log
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
                    "setSession" -> activity.setNativeSession(
                        args.getString("token"),
                        args.getString("apiBase"),
                    )
                    "clearSession" -> activity.clearNativeSession()
                    else -> throw IllegalArgumentException("Unknown method $method")
                }
                activity.resolveJs(id, payload)
            } catch (error: Exception) {
                Log.e("Exerceo", "Health Connect $method failed", error)
                activity.rejectJs(id, formatError(method, error))
            }
        }
    }
}

private fun formatError(method: String, error: Throwable): String {
    val chain = generateSequence(error) { it.cause }
        .map { type ->
            val message = type.message?.trim().orEmpty()
            if (message.isEmpty()) type.javaClass.simpleName else "${type.javaClass.simpleName}: $message"
        }
        .joinToString(" ← ")
    return "$method: $chain"
}
