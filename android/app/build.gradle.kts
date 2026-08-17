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

fun ensureDebugKeystore(): File {
    val dir = File(System.getProperty("user.home"), ".android")
    dir.mkdirs()
    val store = File(dir, "debug.keystore")
    if (store.exists()) {
        return store
    }
    val javaHome = File(System.getProperty("java.home"))
    val keytool =
        File(javaHome, "bin/keytool.exe").takeIf { it.exists() }
            ?: File(javaHome, "bin/keytool")
    exec {
        commandLine(
            keytool.absolutePath,
            "-genkeypair",
            "-keystore",
            store.absolutePath,
            "-storepass",
            "android",
            "-alias",
            "androiddebugkey",
            "-keypass",
            "android",
            "-keyalg",
            "RSA",
            "-keysize",
            "2048",
            "-validity",
            "10000",
            "-dname",
            "CN=Android Debug,O=Android,C=US",
        )
    }
    return store
}

android {
    namespace = "com.exerceo.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.exerceo.app"
        minSdk = 26
        targetSdk = 35
        versionCode = appVersionCode
        versionName = appVersionName
        buildConfigField("String", "WEB_URL", quoted("http://10.0.2.2:5173"))
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("ANDROID_KEYSTORE_FILE")
            if (keystorePath != null) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            } else {
                storeFile = ensureDebugKeystore()
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            buildConfigField(
                "String",
                "WEB_URL",
                quoted("https://exerceo.covium.tech/android/www/index.html"),
            )
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
