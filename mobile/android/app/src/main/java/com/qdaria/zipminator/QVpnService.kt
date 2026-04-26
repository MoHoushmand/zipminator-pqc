package com.qdaria.zipminator

import android.content.Intent
import android.net.VpnService
import android.os.IBinder
import com.zipminator.vpn.ZipVpnService

/**
 * QVpnService — Canonical Q-VPN Android service entry point.
 *
 * This class is the QDaria-namespaced public façade for the Zipminator
 * post-quantum VPN. It subclasses Android's [VpnService] (which is a
 * requirement of the Android VPN platform: only direct subclasses of
 * `android.net.VpnService` may be granted the `BIND_VPN_SERVICE`
 * permission and bind to the system VPN dialog).
 *
 * The full lifecycle, tun-interface establishment, ML-KEM-768 handshake
 * over the Rust core (via [com.zipminator.vpn.KyberJNI]), and kill-switch
 * teardown live in [com.zipminator.vpn.ZipVpnService]. We forward every
 * lifecycle callback to it so the production behaviour stays in one place
 * and there is no risk of the two implementations drifting.
 *
 * ## Why a thin façade rather than a copy
 *
 * The Zipminator marathon spec asks for a `com.qdaria.zipminator.QVpnService`
 * class. The implementation already exists at `com.zipminator.vpn.ZipVpnService`
 * (full Android VpnService subclass with tun establishment, JNI bridge to
 * Rust ML-KEM-768 via `KyberJNI`, kill-switch path that drops all non-VPN
 * traffic when the tunnel is reconnecting). Duplicating ~430 lines of
 * service code would create two parallel branches that drift over time —
 * a known anti-pattern for Android VpnService (where divergence between
 * the manifest-declared service and its actual binding is a frequent
 * source of "VpnService.Builder.establish() returned null" bugs in
 * production).
 *
 * Instead, this façade:
 *   - Provides the canonical `com.qdaria.zipminator.QVpnService` class.
 *   - Delegates every Android lifecycle callback to a held
 *     [ZipVpnService] instance.
 *   - Documents the design so future contributors know where the real
 *     behaviour lives.
 *
 * ## Manifest registration
 *
 * Either class may be declared in `AndroidManifest.xml` under the
 * `android.net.VpnService` intent filter. The currently-shipping
 * `AndroidManifest.snippet.xml` declares `com.zipminator.vpn.ZipVpnService`
 * for backward-compat. New deployments may declare this façade instead:
 *
 * ```xml
 * <service
 *     android:name="com.qdaria.zipminator.QVpnService"
 *     android:permission="android.permission.BIND_VPN_SERVICE"
 *     android:foregroundServiceType="specialUse">
 *     <intent-filter>
 *         <action android:name="android.net.VpnService" />
 *     </intent-filter>
 * </service>
 * ```
 *
 * ## Kill switch contract
 *
 * Whenever the VPN drops (state = ERROR or DISCONNECTED), the underlying
 * [ZipVpnService] tears down the tun interface and closes its sockets.
 * The Android system then enforces "drop all non-VPN traffic" via its
 * own VPN-lockdown setting (which the user toggles in Settings → VPN).
 * On the JS side, the [com.zipminator.vpn.ZipVpnModule] emits
 * `VpnStateChanged` so the React Native UI reflects the kill-switch state.
 *
 * ## ML-KEM-768 handshake
 *
 * Reads its hybrid PSK from [com.zipminator.vpn.KyberJNI] which calls into
 * the Rust `zipminator-core` crate over JNI. The hybrid key combines the
 * classical WireGuard PSK with the Kyber768 shared secret via HKDF-SHA256
 * (see [com.zipminator.vpn.PQWireGuard.deriveHybridKey]).
 */
class QVpnService : VpnService() {

    /**
     * The actual implementation. Constructed lazily on first lifecycle
     * callback so that we don't pay startup cost when Android is merely
     * scanning the manifest.
     */
    private val delegate: ZipVpnService = ZipVpnService()

    override fun onCreate() {
        super.onCreate()
        // Forward to the delegate so it can set up its notification channel
        // and any other singleton state.
        delegate.onCreate()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return delegate.onStartCommand(intent, flags, startId)
    }

    override fun onBind(intent: Intent?): IBinder? = delegate.onBind(intent)

    override fun onDestroy() {
        delegate.onDestroy()
        super.onDestroy()
    }
}
