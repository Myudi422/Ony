import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/** Desktop: Popup-based login (fast, in-place) */
export async function loginWithGoogleFirebase() {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
    idToken: await user.getIdToken(),
  }
}

/**
 * Mobile: Full-page redirect login.
 * Uses browserSessionPersistence (sessionStorage) instead of IndexedDB so that
 * Chrome's storage partitioning doesn't cause getRedirectResult() to return null.
 */
export async function loginWithGoogleRedirect() {
  await setPersistence(auth, browserSessionPersistence)
  await signInWithRedirect(auth, googleProvider)
}

/**
 * Called on page mount after mobile redirect returns from Google.
 * Must use the same persistence as loginWithGoogleRedirect so the stored
 * state can be read back.
 */
export async function checkGoogleRedirectResult() {
  try {
    await setPersistence(auth, browserSessionPersistence)
    const result = await getRedirectResult(auth)
    if (result && result.user) {
      const user = result.user
      return {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        idToken: await user.getIdToken(),
      }
    }
  } catch (err) {
    console.error('Firebase redirect result error:', err)
  }
  return null
}
