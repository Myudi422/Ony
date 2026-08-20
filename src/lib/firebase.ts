import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

function getFirebaseAuth() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig)
    if (typeof window !== 'undefined') {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      })
    }
    return getAuth(app)
  }
  const app = getApp()
  return getAuth(app)
}

export const auth = getFirebaseAuth()
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/** Desktop: Popup-based login */
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

/** Mobile: Full-page redirect login */
export async function loginWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider)
}

/**
 * Called on page mount after mobile redirect returns from Google.
 * Waits for authStateReady before reading getRedirectResult.
 */
export async function checkGoogleRedirectResult() {
  try {
    if (auth.authStateReady) {
      await auth.authStateReady()
    }
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
    throw err
  }
  return null
}
