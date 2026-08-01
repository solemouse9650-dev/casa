export function ConfigError() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f7f4ef',
        color: '#1c2421',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: '#fff',
          border: '1px solid #e4ddd3',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>Casa no pudo iniciar</h1>
        <p style={{ marginTop: 12, lineHeight: 1.5, color: '#5c6b66' }}>
          Faltan las variables de entorno de Firebase en el build de Vercel, o hay que
          volver a desplegar después de agregarlas.
        </p>
        <ol style={{ marginTop: 16, paddingLeft: 18, color: '#5c6b66', lineHeight: 1.6 }}>
          <li>Vercel → Project → Settings → Environment Variables</li>
          <li>
            Agregá todas las <code>VITE_FIREBASE_*</code> y <code>VITE_HOME_ID</code>
          </li>
          <li>Deployments → ⋯ → Redeploy (sin cache si aparece la opción)</li>
        </ol>
      </div>
    </div>
  )
}
