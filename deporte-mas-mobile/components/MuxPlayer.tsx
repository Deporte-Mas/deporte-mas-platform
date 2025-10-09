import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Video, ResizeMode, VideoRef } from 'expo-av';
import MuxData from '@mux/mux-data-react-native-video';
import { MUX_CONFIG } from '../config/mux';

interface MuxPlayerProps {
  assetId: string;
  style?: ViewStyle;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  resizeMode?: ResizeMode;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onPlaybackStatusUpdate?: (status: any) => void;
}

export const MuxPlayer: React.FC<MuxPlayerProps> = ({
  assetId,
  style,
  autoplay = false,
  muted = true,
  loop = false,
  controls = true,
  resizeMode = ResizeMode.CONTAIN,
  onLoad,
  onError,
  onPlaybackStatusUpdate,
}) => {
  const videoRef = useRef<VideoRef>(null);

  useEffect(() => {
    // Configurar Mux Data cuando el componente se monta
    if (MUX_CONFIG.DATA_KEY && MUX_CONFIG.DATA_KEY !== 'your-mux-data-key') {
      MuxData.initialize(MUX_CONFIG.DATA_KEY);
    }
  }, []);

  const videoUrl = `https://stream.mux.com/${assetId}.m3u8`;

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = (error: any) => {
    console.error('Mux Player Error:', error);
    onError?.(error);
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    onPlaybackStatusUpdate?.(status);
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        useNativeControls={controls}
        resizeMode={resizeMode}
        isLooping={loop}
        shouldPlay={autoplay}
        isMuted={muted}
        onLoad={handleLoad}
        onError={handleError}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});