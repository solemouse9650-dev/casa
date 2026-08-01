import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/firebase/config'
import { HOME_ID } from '@/constants'

export async function uploadHomeFile(path: string, file: File) {
  const storageRef = ref(storage, `homes/${HOME_ID}/${path}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
