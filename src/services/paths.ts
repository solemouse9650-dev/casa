import { collection, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { HOME_ID } from '@/constants'

export const homeRef = () => doc(db, 'homes', HOME_ID)
export const homeCol = (name: string) => collection(db, 'homes', HOME_ID, name)
export const homeDoc = (name: string, id: string) => doc(db, 'homes', HOME_ID, name, id)
export const usersCol = () => collection(db, 'users')
export const userDoc = (uid: string) => doc(db, 'users', uid)
