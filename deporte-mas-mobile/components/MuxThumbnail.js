import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Text 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { MUX_CONFIG, getMuxThumbnailUrl } from '../config/mux';

const MuxThumbnail = ({
  assetId,
  style,
  onPress,
  showPlayButton = true,
  title,
  duration,
}) => {
  const videoRef = useRef(null);

  const thumbnailUrl = getMuxThumbnailUrl(assetId, 5); // Thumbnail a los 5 segundos
  const videoUrl = `https://stream.mux.com/${assetId}.m3u8`;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted
        />
        
        {/* Overlay con información */}
        <View style={styles.overlay}>
          {showPlayButton && (
            <View style={styles.playButtonContainer}>
              <Ionicons name="play" size={32} color="white" />
            </View>
          )}
          
          {duration && (
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          )}
        </View>

        {/* Fallback thumbnail si el video no carga */}
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </View>

      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4, // Ajuste visual para centrar el ícono
  },
  durationContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  titleContainer: {
    padding: 12,
  },
  titleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
});

export { MuxThumbnail };