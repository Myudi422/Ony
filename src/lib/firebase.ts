import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

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

export async function loginWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider)
}

export async function checkGoogleRedirectResult() {
  try {
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
