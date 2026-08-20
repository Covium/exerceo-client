package com.exerceo.app

import android.content.Context
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.ZoneId

class ActivitySyncWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val token = SessionStore.token(applicationContext) ?: return Result.success()
        val apiBase = SessionStore.apiBase(applicationContext) ?: return Result.success()
        if (HealthConnectClient.getSdkStatus(applicationContext) != HealthConnectClient.SDK_AVAILABLE) {
            return Result.success()
        }
        val client = HealthConnectClient.getOrCreate(applicationContext)
        val manager = HealthConnectManager(client)
        if (!manager.hasPermissions() || !manager.canReadInBackground()) {
            return Result.success()
        }

        val days = try {
            val zone = ZoneId.systemDefault()
            val today = LocalDate.now(zone)
            val startIso = today.minusDays(6).atStartOfDay(zone).toInstant().toString()
            val endIso = today.atTime(23, 59, 59, 999_000_000).atZone(zone).toInstant().toString()
            manager.readRange(startIso, endIso)
        } catch (error: SecurityException) {
            Log.w("Exerceo", "Background Health Connect read denied", error)
            return Result.success()
        } catch (error: Exception) {
            Log.e("Exerceo", "Background Health Connect read failed", error)
            return Result.retry()
        }

        if (days.length() == 0) {
            return Result.success()
        }

        val code = try {
            putSync(apiBase, token, daysToSyncBody(days).toString())
        } catch (error: IOException) {
            Log.w("Exerceo", "Background activity sync network error", error)
            return Result.retry()
        } catch (error: Exception) {
            Log.e("Exerceo", "Background activity sync failed", error)
            return Result.retry()
        }

        return when (code) {
            in 200..299 -> Result.success()
            401 -> {
                SessionStore.clear(applicationContext)
                ActivitySyncScheduler.cancel(applicationContext)
                Result.success()
            }
            in 500..599 -> Result.retry()
            else -> {
                Log.w("Exerceo", "Background activity sync HTTP $code")
                Result.success()
            }
        }
    }

    private fun putSync(apiBase: String, token: String, body: String): Int {
        val url = URL("${apiBase.trimEnd('/')}/activity/sync")
        val connection = url.openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "PUT"
            connection.connectTimeout = 20_000
            connection.readTimeout = 20_000
            connection.doOutput = true
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Authorization", "Bearer $token")
            connection.outputStream.use { stream ->
                stream.write(body.toByteArray(Charsets.UTF_8))
            }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            stream?.use { it.readBytes() }
            return code
        } finally {
            connection.disconnect()
        }
    }

    private fun daysToSyncBody(days: JSONArray): JSONObject {
        val mapped = JSONArray()
        for (index in 0 until days.length()) {
            val day = days.getJSONObject(index)
            val out = JSONObject().put("date", day.getString("date"))
            copyIfPresent(day, out, "workoutMinutes")
            copyIfPresent(day, out, "steps")
            copyIfPresent(day, out, "activeCalories")
            copyIfPresent(day, out, "weight")
            copyIfPresent(day, out, "bodyFat")
            val sessionsIn = day.optJSONArray("sessions") ?: JSONArray()
            val sessionsOut = JSONArray()
            for (sessionIndex in 0 until sessionsIn.length()) {
                val session = sessionsIn.getJSONObject(sessionIndex)
                sessionsOut.put(
                    JSONObject()
                        .put("externalId", session.getString("externalId"))
                        .put("durationMinutes", session.optInt("durationMinutes"))
                        .put("qualifies", true),
                )
            }
            out.put("sessions", sessionsOut)
            mapped.put(out)
        }
        return JSONObject().put("days", mapped)
    }

    private fun copyIfPresent(from: JSONObject, to: JSONObject, key: String) {
        if (from.has(key) && !from.isNull(key)) {
            to.put(key, from.get(key))
        }
    }
}
