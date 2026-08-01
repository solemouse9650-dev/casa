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

## Deploy

```bash
npm run build
firebase login
firebase use casa-a0dfc
firebase deploy
```

Esto despliega Hosting (`dist/`), reglas de Firestore y reglas de Storage.

## Seguridad

- `.env` está en `.gitignore` (no subir claves al repositorio).
- Solo usuarios autenticados pueden leer/escribir datos.
- Persistencia de sesión con `browserLocalPersistence`.
