package com.exerceo.app

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

object SessionStore {
    private const val FILE = "exerceo_session"
    private const val KEY_TOKEN = "token"
    private const val KEY_API_BASE = "apiBase"

    fun save(context: Context, token: String, apiBase: String) {
        prefs(context).edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_API_BASE, apiBase.trimEnd('/'))
            .apply()
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
    }

    fun token(context: Context): String? {
        return prefs(context).getString(KEY_TOKEN, null)?.takeIf { it.isNotBlank() }
    }

    fun apiBase(context: Context): String? {
        return prefs(context).getString(KEY_API_BASE, null)?.takeIf { it.isNotBlank() }
    }

    fun hasSession(context: Context): Boolean {
        return token(context) != null && apiBase(context) != null
    }

    private fun prefs(context: Context): SharedPreferences {
        val app = context.applicationContext
        return try {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                FILE,
                masterKeyAlias,
                app,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (error: Exception) {
            Log.e("Exerceo", "Encrypted session store unavailable", error)
            app.getSharedPreferences(FILE, Context.MODE_PRIVATE)
        }
    }
}
