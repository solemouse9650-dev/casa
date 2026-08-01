# Casa — Centro de Organización del Hogar

Aplicación web familiar para administrar compras, tareas, calendario, inventario, gastos, notas y actividad en tiempo real.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase Authentication, Cloud Firestore, Storage y Hosting
- Zustand, React Router, Framer Motion, React Hook Form, Zod, Recharts

## Configuración

1. Copiá `.env.example` a `.env` y completá las variables `VITE_FIREBASE_*`.
2. Instalá dependencias:

```bash
npm install
```

3. Ejecutá en local:

```bash
npm run dev
```

Los usuarios se crean manualmente en Firebase Authentication. No hay registro público.

## Firebase (obligatorio para que guarde datos)

Si la app no guarda compras/tareas, casi seguro faltan las **reglas** o la base Firestore.

### 1) Crear Firestore
Firebase Console → proyecto `casa-a0dfc` → **Build → Firestore Database → Create database**  
Modo: **Production** → ubicación cualquiera → Enable.

### 2) Pegar reglas de Firestore
Firestore → **Rules** → reemplazá todo por el contenido de `firestore.rules` → **Publish**.

### 3) Storage (imágenes)
**Build → Storage → Get started** → Rules → pegá `storage.rules` → **Publish**.

### 4) Auth
**Authentication → Sign-in method** → habilitar **Email/Password**.  
**Settings → Authorized domains** → agregar `localhost`, tu dominio de Vercel (`casa-rrby.vercel.app`).

### 5) Deploy CLI (opcional, con tu cuenta dueña del proyecto)
```bash
npx firebase login
npx firebase use casa-a0dfc
npx firebase deploy --only firestore:rules,storage
```

## Deploy web

```bash
npm run build
# Vercel redeploy, o:
firebase deploy --only hosting
```

## Seguridad

- `.env` está en `.gitignore`.
- Solo usuarios autenticados pueden leer/escribir.
- Persistencia de sesión con `browserLocalPersistence`.
