import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { WebView } from 'react-native-webview'
import { useRef, useState, useEffect } from 'react'

const ERP_URL = 'https://tns-erp.onrender.com'

export default function App() {
  const webviewRef  = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ถ้าโหลดนานกว่า 8 วินาที แสดงข้อความว่า server กำลังตื่น
  useEffect(() => {
    if (loading && !error) {
      timerRef.current = setTimeout(() => setSlowLoad(true), 8000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setSlowLoad(false)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [loading, error])

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0f1117" />

      {/* Loading overlay */}
      {loading && !error && (
        <View style={styles.overlay}>
          <Text style={styles.title}>TNS ERP</Text>
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 24 }} />
          {!slowLoad ? (
            <Text style={styles.subtitle}>กำลังโหลด...</Text>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={styles.subtitle}>Server กำลังตื่นจากโหมดประหยัดพลังงาน</Text>
              <Text style={[styles.subtitle, { marginTop: 6, fontSize: 12 }]}>
                รอสักครู่ (~30-60 วินาที)
              </Text>
              <View style={styles.wakeBar}>
                <View style={styles.wakeBarFill} />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Error screen */}
      {error && (
        <View style={styles.overlay}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📡</Text>
          <Text style={styles.title}>เชื่อมต่อไม่ได้</Text>
          <Text style={styles.subtitle}>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(false); setLoading(true); webviewRef.current?.reload() }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>🔄 ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {!error && (
        <WebView
          ref={webviewRef}
          source={{ uri: ERP_URL }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true) }}
          javaScriptEnabled
          domStorageEnabled
          pullToRefreshEnabled
          userAgent="TNS-ERP-Mobile/1.0 Android"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  webview:   { flex: 1, backgroundColor: '#0f1117' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, padding: 32,
  },
  title:    { fontSize: 28, fontWeight: '800', color: '#6366f1', letterSpacing: 2 },
  subtitle: { marginTop: 12, color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 24, paddingHorizontal: 32, paddingVertical: 12,
    backgroundColor: '#6366f1', borderRadius: 10,
  },
  wakeBar: {
    marginTop: 20, width: 200, height: 4,
    backgroundColor: '#1e2235', borderRadius: 2, overflow: 'hidden',
  },
  wakeBarFill: {
    width: '60%', height: '100%',
    backgroundColor: '#6366f1', borderRadius: 2,
  },
})
