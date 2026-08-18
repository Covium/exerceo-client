plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

fun quoted(value: String): String = "\"${value.replace("\"", "\\\"")}\""

fun envOrProp(prop: String, env: String): String? {
    val fromProp = (project.findProperty(prop) as String?)?.trim()
    if (!fromProp.isNullOrEmpty()) {
        return fromProp
    }
    return System.getenv(env)?.trim()?.takeIf { it.isNotEmpty() }
}

val appVersionName = envOrProp("exerceoVersion", "EXERCEO_VERSION") ?: "0.1.0"
val appVersionCode =
    envOrProp("exerceoVersionCode", "EXERCEO_VERSION_CODE")?.toInt() ?: 1
val keystorePath = System.getenv("ANDROID_KEYSTORE_FILE")?.trim()?.takeIf { it.isNotEmpty() }
val debugWebUrl =
    envOrProp("exerceoWebUrl", "EXERCEO_WEB_URL") ?: "http://10.0.2.2:5173"
val bundledWebUrl = "https://exerceo.covium.tech/android/www/index.html"

android {
    namespace = "com.exerceo.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.exerceo.app"
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersionName
        buildConfigField("String", "WEB_URL", quoted(debugWebUrl))
    }

    signingConfigs {
        create("release") {
            val path = keystorePath
            if (path != null) {
                storeFile = file(path)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            if (keystorePath != null) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
        release {
            isMinifyEnabled = false
            if (keystorePath != null) {
                signingConfig = signingConfigs.getByName("release")
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            buildConfigField("String", "WEB_URL", quoted(bundledWebUrl))
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.health.connect:connect-client:1.1.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1")
}
