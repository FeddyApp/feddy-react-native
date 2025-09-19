package com.feddyreactnative

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = FeddyReactNativeModule.NAME)
class FeddyReactNativeModule(reactContext: ReactApplicationContext) :
  NativeFeddyReactNativeSpec(reactContext) {

  private val preferences: SharedPreferences =
    reactContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  override fun getName(): String {
    return NAME
  }

  override fun configure(options: ReadableMap): WritableMap {
    val apiKey = options.getString("apiKey")?.trim() ?: ""
    val enableDebugLogging =
      if (options.hasKey("enableDebugLogging")) options.getBoolean("enableDebugLogging") else false

    if (apiKey.isEmpty()) {
      Log.w(TAG, "Configuration failed: API key cannot be empty")
      return currentState()
    }

    preferences.edit()
      .putString(KEY_API_KEY, apiKey)
      .putBoolean(KEY_DEBUG_ENABLED, enableDebugLogging)
      .apply()

    ensureUserId()

    if (enableDebugLogging) {
      val prefix = if (apiKey.length >= 8) apiKey.substring(0, 8) else apiKey
      Log.i(TAG, "SDK configured with API key prefix $prefix")
    }

    return currentState()
  }

  override fun updateUser(options: ReadableMap): WritableMap {
    if (!isConfigured()) {
      Log.w(TAG, "Attempted to update user before configure was called")
      return currentUser()
    }

    if (options.hasKey("userId") && !options.isNull("userId")) {
      val userId = options.getString("userId")?.takeIf { it.isNotEmpty() } ?: generateUserId()
      preferences.edit().putString(KEY_USER_ID, userId).apply()
    }

    if (options.hasKey("email") && !options.isNull("email")) {
      val email = options.getString("email")
      preferences.edit().putString(KEY_USER_EMAIL, email).apply()
    }

    if (options.hasKey("name") && !options.isNull("name")) {
      val name = options.getString("name")
      preferences.edit().putString(KEY_USER_NAME, name).apply()
    }

    return currentUser()
  }

  override fun resetUserData(): WritableMap {
    if (!isConfigured()) {
      Log.w(TAG, "Attempted to reset user data before configure was called")
      return currentUser()
    }

    preferences.edit()
      .remove(KEY_USER_ID)
      .remove(KEY_USER_EMAIL)
      .remove(KEY_USER_NAME)
      .apply()

    ensureUserId()

    return currentUser()
  }

  override fun hasPersistentUserData(): Boolean {
    val userId = preferences.getString(KEY_USER_ID, null)
    val email = preferences.getString(KEY_USER_EMAIL, null)
    val name = preferences.getString(KEY_USER_NAME, null)
    return !userId.isNullOrEmpty() || !email.isNullOrEmpty() || !name.isNullOrEmpty()
  }

  override fun getUser(): WritableMap {
    return currentUser()
  }

  override fun getState(): WritableMap {
    return currentState()
  }

  private fun isConfigured(): Boolean {
    val apiKey = preferences.getString(KEY_API_KEY, null)
    return !apiKey.isNullOrEmpty()
  }

  private fun generateUserId(): String {
    return java.util.UUID.randomUUID().toString()
  }

  private fun ensureUserId(): String {
    val current = preferences.getString(KEY_USER_ID, null)
    return if (!current.isNullOrEmpty()) {
      current
    } else {
      val generated = generateUserId()
      preferences.edit().putString(KEY_USER_ID, generated).apply()
      generated
    }
  }

  private fun currentUser(): WritableMap {
    val map = Arguments.createMap()
    map.putString("userId", ensureUserId())
    map.putString("email", preferences.getString(KEY_USER_EMAIL, null))
    map.putString("name", preferences.getString(KEY_USER_NAME, null))
    return map
  }

  private fun currentState(): WritableMap {
    val map = Arguments.createMap()
    map.putString("apiKey", preferences.getString(KEY_API_KEY, null))
    map.putString("baseUrl", BASE_URL)
    map.putBoolean("isConfigured", isConfigured())
    map.putString("sdkVersion", SDK_VERSION)
    map.putMap("user", currentUser())
    return map
  }

  companion object {
    const val NAME = "FeddyReactNative"
    private const val TAG = "Feddy"

    private const val PREFERENCES_NAME = "com.feddy.sdk"
    private const val KEY_API_KEY = "com.feddy.sdk.apiKey"
    private const val KEY_DEBUG_ENABLED = "com.feddy.sdk.debug"
    private const val KEY_USER_ID = "com.feddy.sdk.userId"
    private const val KEY_USER_EMAIL = "com.feddy.sdk.userEmail"
    private const val KEY_USER_NAME = "com.feddy.sdk.userName"

    private const val BASE_URL = "https://feddy.app"
    private const val SDK_VERSION = "1.0.0"
  }
}

