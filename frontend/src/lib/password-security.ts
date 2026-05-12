import { createHash } from 'crypto';

/**
 * Checks password against HIBP Pwned Passwords API using k-anonymity.
 * Returns true when password appears in known breaches.
 */
export async function isCompromisedPassword(password: string): Promise<boolean> {
  const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true',
      'User-Agent': 'sport-equipment-borrowing-system',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HIBP request failed: ${response.status}`);
  }

  const body = await response.text();
  const lines = body.split('\n');
  for (const line of lines) {
    const [hashSuffix] = line.trim().split(':');
    if (hashSuffix === suffix) {
      return true;
    }
  }

  return false;
}
