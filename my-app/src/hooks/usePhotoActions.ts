import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

const FAVOURITES_ALBUM = 'open-gallery/favourites';
// On Android the album title seen by MediaLibrary is the leaf folder name
const FAVOURITES_ALBUM_TITLE = 'favourites';

/**
 * Ensures the favourites album exists, creates it if not.
 * Returns the album object.
 */
async function getOrCreateFavouritesAlbum(assetId: string): Promise<MediaLibrary.Album> {
  // getAlbumAsync only searches top-level names — we use a flat name with slash
  // so it becomes a subfolder on Android and a named album on iOS
  let album = await MediaLibrary.getAlbumAsync(FAVOURITES_ALBUM);
  if (!album) {
    // createAlbumAsync needs an initial asset to create the album
    album = await MediaLibrary.createAlbumAsync(FAVOURITES_ALBUM, assetId, false);
  }
  return album;
}

export type PhotoActionResult = 'favourited' | 'deleted' | 'error';

export function usePhotoActions() {
  /**
   * Copy the asset into open-gallery/favourites album.
   * The original stays in place — this is a non-destructive copy.
   */
  const addToFavourites = async (assetId: string): Promise<PhotoActionResult> => {
    try {
      let album = await MediaLibrary.getAlbumAsync(FAVOURITES_ALBUM_TITLE);
      if (!album) {
        await MediaLibrary.createAlbumAsync(FAVOURITES_ALBUM, assetId, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([assetId], album, true);
      }
      return 'favourited';
    } catch (e) {
      console.warn('addToFavourites error', e);
      return 'error';
    }
  };

  /**
   * Permanently delete the asset via the system trash / delete flow.
   * On Android this moves to the system recycle bin (Android 11+),
   * on older Android it deletes permanently after confirmation.
   */
  const deletePhoto = async (assetId: string): Promise<PhotoActionResult> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete photo',
        'Move this photo to trash?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve('error') },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await MediaLibrary.deleteAssetsAsync([assetId]);
                resolve('deleted');
              } catch (e) {
                console.warn('deletePhoto error', e);
                resolve('error');
              }
            },
          },
        ]
      );
    });
  };

  return { addToFavourites, deletePhoto };
}
