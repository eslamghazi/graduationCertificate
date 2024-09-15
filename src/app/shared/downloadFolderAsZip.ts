import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  getStorage,
  listAll,
  ref,
  getDownloadURL,
  getMetadata,
} from '@angular/fire/storage';

export const downloadFolderAsZip = async (
  path: string,
  zipNameWillBe: string
) => {
  const jszip = new JSZip();
  const storage = getStorage(); // Now this will work since Firebase is initialized
  const folderRef = ref(storage, path);

  try {
    const folder = await listAll(folderRef);

    const promises = folder.items.map(async (item) => {
      try {
        const fileMetadata = await getMetadata(item);
        const fileRef = ref(storage, item.fullPath);
        const fileUrl = await getDownloadURL(fileRef);
        const fileBlob = await fetch(fileUrl).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          return response.blob();
        });
        jszip.file(fileMetadata.name, fileBlob);
      } catch (fileError) {
        console.error('Error processing file:', fileError);
      }
    });

    await Promise.all(promises);
    const zipBlob = await jszip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${zipNameWillBe}.zip`);
  } catch (folderError) {
    console.error('Error processing folder:', folderError);
  }
};
