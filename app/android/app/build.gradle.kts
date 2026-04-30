import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(keystorePropertiesFile.inputStream())
}

android {
    namespace = "com.qdaria.zipminator"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.qdaria.zipminator"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
            // R8 trips over transitive javax.lang.model.* (annotation-processor
            // classes pulled in via auto-value / javapoet; not runtime-needed).
            // Disabling minify until proguard keep-rules are written for FRB,
            // MediaPipe, and the FFI surface. Tracked in FEATURES.md.
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

dependencies {
    // Google AI Edge LiteRT-LM runtime for on-device Gemma inference.
    // Disabled 2026-04-30: artifact com.google.ai.edge.litert:litert-lm:1.0.0
    // is not published to any Maven repo (Google, Maven Central, JitPack).
    // Re-enable once a public release ships. MediaPipe path remains the
    // production runtime for Q-AI on Android.
    // implementation("com.google.ai.edge.litert:litert-lm:1.0.0")

    // MediaPipe (production on-device LLM runtime; .task format models).
    implementation("com.google.mediapipe:tasks-genai:0.10.22")
}

flutter {
    source = "../.."
}
