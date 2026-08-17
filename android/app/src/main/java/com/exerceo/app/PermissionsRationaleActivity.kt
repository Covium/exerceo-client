package com.exerceo.app

import android.os.Bundle
import android.widget.TextView
import androidx.activity.ComponentActivity

class PermissionsRationaleActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val view = TextView(this)
        val padding = (24 * resources.displayMetrics.density).toInt()
        view.setPadding(padding, padding, padding, padding)
        view.setTextColor(0xFFF6F6EF.toInt())
        view.setBackgroundColor(0xFF090911.toInt())
        view.textSize = 16f
        view.text = getString(R.string.health_rationale)
        setContentView(view)
    }
}
