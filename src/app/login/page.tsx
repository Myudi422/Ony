import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Login' }

import LoginClient from './LoginClient'
export default function LoginPage() { return <LoginClient /> }
