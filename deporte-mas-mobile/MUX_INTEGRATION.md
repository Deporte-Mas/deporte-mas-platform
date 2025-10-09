# Integración de Mux Player en Deporte Más Mobile

## Configuración Inicial

### 1. Obtener las claves de Mux

1. Ve a [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)
2. Crea un nuevo token de acceso
3. Copia tu **Environment Key** y **Data Key**

### 2. Configurar variables de entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus claves reales:
   ```env
   EXPO_PUBLIC_MUX_ENVIRONMENT_KEY=tu-environment-key-aqui
   EXPO_PUBLIC_MUX_DATA_KEY=tu-data-key-aqui
   ```

### 3. Subir videos a Mux

1. Ve a [Mux Dashboard > Assets](https://dashboard.mux.com/assets)
2. Sube tus videos
3. Copia los **Asset IDs** de tus videos
4. Actualiza los Asset IDs en los archivos de las pantallas:
   - `app/home.tsx`
   - `app/play.tsx`
   - `app/program.tsx`

## Componentes Creados

### MuxPlayer
Componente principal para reproducir videos de Mux con controles nativos.

```tsx
<MuxPlayer
  assetId="tu-asset-id"
  autoplay={false}
  muted={false}
  controls={true}
  onLoad={() => console.log('Video cargado')}
  onError={(error) => console.error('Error:', error)}
/>
```

### MuxThumbnail
Componente para mostrar thumbnails de videos con overlay de play.

```tsx
<MuxThumbnail
  assetId="tu-asset-id"
  title="Título del video"
  duration="45:30"
  onPress={() => router.push('/program')}
/>
```

## Características Implementadas

- ✅ Reproducción de videos desde Mux
- ✅ Thumbnails automáticos generados por Mux
- ✅ Controles nativos de video
- ✅ Analytics con Mux Data
- ✅ Fallback a thumbnails estáticos
- ✅ Títulos y duración en thumbnails
- ✅ Integración con expo-av

## Estructura de Archivos

```
├── config/
│   └── mux.ts                 # Configuración de Mux
├── components/
│   ├── MuxPlayer.tsx          # Componente reproductor principal
│   └── MuxThumbnail.tsx       # Componente thumbnail
├── app/
│   ├── home.tsx               # Pantalla principal con video principal
│   ├── play.tsx               # Pantalla de videos anteriores
│   └── program.tsx            # Pantalla de reproducción individual
└── .env.example               # Variables de entorno de ejemplo
```

## Próximos Pasos

1. **Configurar las claves de Mux** en el archivo `.env`
2. **Subir videos** a Mux y obtener los Asset IDs
3. **Actualizar los Asset IDs** en los archivos de las pantallas
4. **Probar la reproducción** en dispositivos reales
5. **Configurar analytics** si es necesario

## Notas Importantes

- Los videos deben estar en formato compatible con HLS (MP4, MOV, etc.)
- Mux genera automáticamente múltiples calidades de video
- Los thumbnails se generan automáticamente a los 5 segundos del video
- La integración usa `--legacy-peer-deps` para resolver conflictos de dependencias