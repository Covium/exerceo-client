package com.exerceo.app

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.roundToInt

class HealthConnectManager(private val client: HealthConnectClient) {
    val permissions: Set<String> = setOf(
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(BodyFatRecord::class),
    )

    suspend fun hasPermissions(): Boolean {
        return client.permissionController.getGrantedPermissions().containsAll(permissions)
    }

    suspend fun readRange(startIso: String, endIso: String): JSONArray {
        val start = Instant.parse(startIso)
        val end = Instant.parse(endIso)
        val filter = TimeRangeFilter.between(start, end)
        val zone = ZoneId.systemDefault()
        val days = linkedMapOf<LocalDate, DayAccumulator>()

        client.readRecords(
            ReadRecordsRequest(ExerciseSessionRecord::class, timeRangeFilter = filter),
        ).records.forEach { record ->
            val date = record.startTime.atZone(zone).toLocalDate()
            val minutes = Duration.between(record.startTime, record.endTime).toMinutes().toInt().coerceAtLeast(0)
            val day = days.getOrPut(date) { DayAccumulator() }
            day.workoutMinutes += minutes
            day.sessions.put(
                JSONObject()
                    .put("externalId", record.metadata.id.ifBlank { record.startTime.toString() })
                    .put("start", record.startTime.toString())
                    .put("end", record.endTime.toString())
                    .put("durationMinutes", minutes),
            )
        }

        client.readRecords(
            ReadRecordsRequest(StepsRecord::class, timeRangeFilter = filter),
        ).records.forEach { record ->
            val date = record.startTime.atZone(zone).toLocalDate()
            days.getOrPut(date) { DayAccumulator() }.steps += record.count
        }

        client.readRecords(
            ReadRecordsRequest(ActiveCaloriesBurnedRecord::class, timeRangeFilter = filter),
        ).records.forEach { record ->
            val date = record.startTime.atZone(zone).toLocalDate()
            days.getOrPut(date) { DayAccumulator() }.activeCalories +=
                record.energy.inKilocalories.roundToInt()
        }

        client.readRecords(
            ReadRecordsRequest(WeightRecord::class, timeRangeFilter = filter),
        ).records.forEach { record ->
            val date = record.time.atZone(zone).toLocalDate()
            days.getOrPut(date) { DayAccumulator() }.weight = record.weight.inKilograms
        }

        client.readRecords(
            ReadRecordsRequest(BodyFatRecord::class, timeRangeFilter = filter),
        ).records.forEach { record ->
            val date = record.time.atZone(zone).toLocalDate()
            days.getOrPut(date) { DayAccumulator() }.bodyFat = record.percentage.value
        }

        val result = JSONArray()
        days.entries.sortedBy { it.key }.forEach { (date, acc) ->
            val json = JSONObject().put("date", date.toString())
            if (acc.steps > 0) json.put("steps", acc.steps)
            if (acc.activeCalories > 0) json.put("activeCalories", acc.activeCalories)
            if (acc.workoutMinutes > 0) json.put("workoutMinutes", acc.workoutMinutes)
            acc.weight?.let { json.put("weight", it) }
            acc.bodyFat?.let { json.put("bodyFat", it) }
            json.put("sessions", acc.sessions)
            result.put(json)
        }
        return result
    }

    private class DayAccumulator {
        var steps: Long = 0
        var activeCalories: Int = 0
        var workoutMinutes: Int = 0
        var weight: Double? = null
        var bodyFat: Double? = null
        val sessions = JSONArray()
    }
}
