#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push notifications.
 * Run: node scripts/generate-vapid-keys.js
 * Then copy the keys to your .env file.
 */

const crypto = require('crypto')

async function generateVapidKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  )

  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const publicKey = Buffer.from(publicKeyBuffer).toString('base64url')
  const privateKey = Buffer.from(privateKeyBuffer).toString('base64url')

  console.log('\n=== VAPID Keys generated ===\n')
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
  console.log('\nAdd VITE_VAPID_PUBLIC_KEY to your .env file.')
  console.log('Keep VAPID_PRIVATE_KEY on your server only (never in .env for frontend).\n')
}

generateVapidKeys().catch(console.error)
