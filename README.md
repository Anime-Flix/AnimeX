# AnimeX — Plataforma de Streaming de Anime

Plataforma de streaming de anime de nivel profesional construida con HTML/CSS/JS vanilla + Firebase.

---

## 🚀 Deploy en GitHub Pages

### 1. Crear repositorio en GitHub
```bash
git init
git add .
git commit -m "feat: AnimeX v1.0"
git remote add origin https://github.com/TU_USUARIO/animex.git
git push -u origin main
```

### 2. Activar GitHub Pages
- Ve a **Settings → Pages**
- Source: `Deploy from a branch`
- Branch: `main` / `/ (root)`
- Guarda y espera ~2 minutos

### 3. Configurar Firebase
En la [consola de Firebase](https://console.firebase.google.com/project/animex-f9e35):

#### a) Habilitar Authentication
- Authentication → Sign-in method → Email/Password → Activar

#### b) Crear base de datos Firestore
- Firestore Database → Create database → Production mode

#### c) Subir reglas de seguridad
```bash
# Instala Firebase CLI
npm install -g firebase-tools
firebase login
firebase init firestore
# Copia el contenido de firestore.rules
firebase deploy --only firestore:rules
```

#### d) Agregar dominio de GitHub Pages a Firebase Auth
- Authentication → Settings → Authorized domains
- Agrega: `TU_USUARIO.github.io`

---

## 🔐 Crear cuenta administrador

1. Regístrate normalmente en `/register.html`
2. En la consola de Firebase → Firestore → `users/{tu_uid}`
3. Edita el campo `role` de `"user"` a `"admin"`
4. Edita el campo `status` de `"pending"` a `"active"`
5. ¡Listo! Ahora puedes acceder a `/admin/index.html`

---

## 📁 Estructura de archivos

```
animex/
├── index.html          # Home / Catálogo principal
├── login.html          # Inicio de sesión
├── register.html       # Registro + selección de plan
├── activate.html       # Activación + chat con admin
├── anime.html          # Detalle de anime
├── player.html         # Reproductor de video
├── firestore.rules     # Reglas de seguridad Firestore
├── admin/
│   ├── index.html      # Panel de administración
│   └── episodes.html   # Gestor de temporadas/episodios
└── assets/
    ├── css/
    │   ├── main.css    # Design system + componentes globales
    │   └── home.css    # Estilos específicos del home
    ├── js/
    │   ├── core/
    │   │   ├── firebase.js   # Configuración Firebase
    │   │   └── auth.js       # Servicio de autenticación
    │   ├── services/
    │   │   ├── animeService.js      # CRUD de animes/episodios
    │   │   ├── userService.js       # Historial, favoritos, progreso
    │   │   ├── planService.js       # Planes de suscripción
    │   │   ├── chatService.js       # Chat usuario ↔ admin
    │   │   └── recommendService.js  # Motor de recomendaciones
    │   └── components/
    │       ├── carousel.js   # Carruseles con drag
    │       └── toast.js      # Notificaciones
    └── img/
        └── favicon.svg
```

---

## 🎥 Cómo subir videos con Google Drive

### En el panel admin:

1. **Conectar Drive**: Admin → Almacenamiento → "Conectar Drive"
   - Agrega el nombre, ID de carpeta raíz y capacidad

2. **Subir video a Drive**:
   - Sube el video a Google Drive
   - Click derecho → "Obtener enlace" → cambiar a "Cualquiera con el enlace puede ver"
   - Copia el ID del URL: `drive.google.com/file/d/**ESTE_ID**/view`

3. **Agregar episodio**: Admin → Animes → Editar → Episodios
   - Pega el ID del archivo
   - Selecciona la cuenta de Drive
   - Guarda

### Importante sobre Google Drive:
- Los videos deben tener **permisos de "Cualquiera con el enlace"**
- Drive tiene límites de reproducción diarios (~100 views/archivo)
- Para producción real, considera migrar a **Bunny CDN** o **Cloudflare Stream**

---

## 💡 Flujo de usuario

```
Registro → Selecciona plan → Cuenta pendiente
    ↓
Chat con admin → Envía comprobante de pago
    ↓
Admin verifica → Genera código (ej: PREM-XXXX-XXXX)
    ↓
Admin envía código por chat
    ↓
Usuario activa cuenta → Accede al contenido
    ↓
Ve anime → Progreso guardado automáticamente
    ↓
Recomendaciones personalizadas según historial
```

---

## ⌨️ Atajos del reproductor

| Tecla | Acción |
|-------|--------|
| `Espacio` / `K` | Play / Pausa |
| `F` | Pantalla completa |
| `→` | +10 segundos |
| `←` | -10 segundos |
| `↑` | Subir volumen |
| `↓` | Bajar volumen |
| `M` | Silenciar |
| `N` | Siguiente episodio |
| `P` | Episodio anterior |

---

## 🔮 Próximas fases

- **Fase 2**: Perfiles múltiples, comentarios y reseñas
- **Fase 3**: Notificaciones push, descarga offline
- **Fase 4**: Migración CDN (Bunny/Cloudflare), subtítulos .vtt
- **Fase 5**: App móvil (PWA)
