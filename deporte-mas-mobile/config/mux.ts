// Mux Configuration
export const MUX_CONFIG = {
  // Reemplaza con tu Environment Key de Mux
  ENVIRONMENT_KEY: process.env.EXPO_PUBLIC_MUX_ENVIRONMENT_KEY || 'your-mux-environment-key',
  
  // Reemplaza con tu Data Key de Mux (opcional, para analytics)
  DATA_KEY: process.env.EXPO_PUBLIC_MUX_DATA_KEY || 'your-mux-data-key',
  
  // URLs de ejemplo de videos Mux (reemplaza con tus asset IDs reales)
  SAMPLE_VIDEOS: {
    MAIN_VIDEO: 'https://stream.mux.com/your-main-video-asset-id.m3u8',
    THUMBNAIL_1: 'https://stream.mux.com/your-thumbnail-1-asset-id.m3u8',
    THUMBNAIL_2: 'https://stream.mux.com/your-thumbnail-2-asset-id.m3u8',
    THUMBNAIL_3: 'https://stream.mux.com/your-thumbnail-3-asset-id.m3u8',
  },
  
  // Configuración del player
  PLAYER_CONFIG: {
    autoplay: false,
    muted: true,
    loop: true,
    controls: true,
    preload: 'metadata',
  }
};

// Función para obtener la URL de thumbnail de Mux
export const getMuxThumbnailUrl = (assetId: string, time?: number) => {
  const timeParam = time ? `?time=${time}` : '';
  return `https://image.mux.com/${assetId}/thumbnail.jpg${timeParam}`;
};

// Función para obtener la URL de video de Mux
export const getMuxVideoUrl = (assetId: string) => {
  return `https://stream.mux.com/${assetId}.m3u8`;
};