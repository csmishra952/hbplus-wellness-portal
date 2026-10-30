/**
 * HB+ Firestore Rules Red Team Verification Suite
 * Validates all 12 "Dirty Dozen" adversarial payloads defined in security_spec.md
 * against the deterministic rule boolean invariants.
 */

export interface MockAuthContext {
  uid: string;
  email: string;
  email_verified: boolean;
  isAdminDocPresent?: boolean;
}

export interface RuleRequest {
  collection: 'profiles' | 'wellnessLogs' | 'domainSettings' | 'admins';
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: MockAuthContext | null;
  requestTimeIso: string;
  incomingData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  profileExistsForUid?: boolean;
}

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function isAdmin(auth: MockAuthContext | null): boolean {
  if (!auth || !auth.email_verified) return false;
  return auth.email === 'csmishra952@gmail.com' || Boolean(auth.isAdminDocPresent);
}

export function evaluateFirestoreRule(req: RuleRequest): 'ALLOW' | 'PERMISSION_DENIED' {
  const { auth, collection, docId, operation, incomingData, existingData, requestTimeIso } = req;
  if (!auth) return 'PERMISSION_DENIED';
  if (operation !== 'list' && !isValidId(docId)) return 'PERMISSION_DENIED';
  if (operation === 'delete') return 'PERMISSION_DENIED';

  if (collection === 'profiles') {
    if (operation === 'get') {
      return docId === auth.uid || isAdmin(auth) ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (operation === 'list') {
      const ownerMatches = existingData?.uid === auth.uid;
      const bootstrappedAdmin = auth.email_verified && auth.email === 'csmishra952@gmail.com';
      return ownerMatches || bootstrappedAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
    }
    if (!auth.email_verified || !incomingData) return 'PERMISSION_DENIED';

    const allowedKeys = [
      'uid',
      'email',
      'fullName',
      'avatarUrl',
      'role',
      'assignedProgram',
      'domainVerified',
      'createdAt',
      'updatedAt',
    ];
    const keys = Object.keys(incomingData);
    if (keys.length !== allowedKeys.length || !keys.every((k) => allowedKeys.includes(k))) {
      return 'PERMISSION_DENIED';
    }
    if (
      typeof incomingData.fullName !== 'string' ||
      incomingData.fullName.length < 1 ||
      incomingData.fullName.length > 100 ||
      typeof incomingData.email !== 'string' ||
      !EMAIL_REGEX.test(incomingData.email)
    ) {
      return 'PERMISSION_DENIED';
    }

    if (operation === 'create') {
      if (docId !== auth.uid || incomingData.uid !== auth.uid) return 'PERMISSION_DENIED';
      if (incomingData.email !== auth.email) return 'PERMISSION_DENIED';
      if (incomingData.createdAt !== requestTimeIso || incomingData.updatedAt !== requestTimeIso) {
        return 'PERMISSION_DENIED';
      }
      if (incomingData.role === 'admin' && !isAdmin(auth)) return 'PERMISSION_DENIED';
      return incomingData.role === 'user' || incomingData.role === 'admin' ? 'ALLOW' : 'PERMISSION_DENIED';
    }

    if (operation === 'update' && existingData) {
      if (incomingData.uid !== existingData.uid) return 'PERMISSION_DENIED';
      if (incomingData.email !== existingData.email) return 'PERMISSION_DENIED';
      if (incomingData.createdAt !== existingData.createdAt) return 'PERMISSION_DENIED';
      if (incomingData.updatedAt !== requestTimeIso) return 'PERMISSION_DENIED';
      if (docId === auth.uid && !isAdmin(auth)) {
        if (incomingData.role !== existingData.role) return 'PERMISSION_DENIED';
        return 'ALLOW';
      }
      return isAdmin(auth) ? 'ALLOW' : 'PERMISSION_DENIED';
    }
  }

  if (collection === 'wellnessLogs') {
    if (operation === 'create') {
      if (!auth.email_verified || !req.profileExistsForUid) return 'PERMISSION_DENIED';
      if (docId !== auth.uid || incomingData?.ownerId !== auth.uid) return 'PERMISSION_DENIED';
      if (incomingData?.createdAt !== requestTimeIso || incomingData?.updatedAt !== requestTimeIso) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
    if (operation === 'update' && existingData && incomingData) {
      if (!auth.email_verified || docId !== auth.uid) return 'PERMISSION_DENIED';
      if (incomingData.updatedAt !== requestTimeIso) return 'PERMISSION_DENIED';
      if (incomingData.createdAt !== existingData.createdAt) return 'PERMISSION_DENIED';
      return 'ALLOW';
    }
  }

  if (collection === 'domainSettings') {
    if (operation === 'update' || operation === 'create') {
      return isAdmin(auth) && docId === 'global' ? 'ALLOW' : 'PERMISSION_DENIED';
    }
  }

  return 'PERMISSION_DENIED';
}

export function runDirtyDozenSecurityAudit(): void {
  const now = '2026-10-29T19:35:00.000Z';
  const baseProfile = {
    uid: 'uid_member',
    email: 'member@hbplus.fit',
    fullName: 'Maya Lin',
    avatarUrl: '',
    role: 'user',
    assignedProgram: 'Push Hypertrophy',
    domainVerified: true,
    createdAt: now,
    updatedAt: now,
  };

  const dirtyDozen: Array<{ name: string; req: RuleRequest }> = [
    {
      name: '1. Self-Assigned Admin Escalation',
      req: {
        collection: 'profiles',
        docId: 'uid_member',
        operation: 'create',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        incomingData: { ...baseProfile, role: 'admin' },
      },
    },
    {
      name: '2. Cross-User Profile Spoofing',
      req: {
        collection: 'profiles',
        docId: 'uid_victim',
        operation: 'create',
        auth: { uid: 'uid_attacker', email: 'attacker@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        incomingData: { ...baseProfile, uid: 'uid_victim' },
      },
    },
    {
      name: '3. Unverified Email Spoof Attack',
      req: {
        collection: 'profiles',
        docId: 'uid_victim',
        operation: 'get',
        auth: { uid: 'uid_spoof', email: 'csmishra952@gmail.com', email_verified: false },
        requestTimeIso: now,
      },
    },
    {
      name: '4. PII Blanket Read Scrape',
      req: {
        collection: 'profiles',
        docId: 'uid_victim',
        operation: 'get',
        auth: { uid: 'uid_attacker', email: 'attacker@hbplus.fit', email_verified: true },
        requestTimeIso: now,
      },
    },
    {
      name: '5. Shadow Update (Ghost Field Injection)',
      req: {
        collection: 'profiles',
        docId: 'uid_member',
        operation: 'update',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        existingData: baseProfile,
        incomingData: { ...baseProfile, isSuperAdmin: true },
      },
    },
    {
      name: '6. Role Mutation on Update',
      req: {
        collection: 'profiles',
        docId: 'uid_member',
        operation: 'update',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        existingData: baseProfile,
        incomingData: { ...baseProfile, role: 'admin' },
      },
    },
    {
      name: '7. Immortal Timestamp Tampering',
      req: {
        collection: 'profiles',
        docId: 'uid_member',
        operation: 'update',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        existingData: baseProfile,
        incomingData: { ...baseProfile, createdAt: '1999-01-01T00:00:00.000Z' },
      },
    },
    {
      name: '8. Client-Forged Future updatedAt',
      req: {
        collection: 'wellnessLogs',
        docId: 'uid_member',
        operation: 'update',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        existingData: { ownerId: 'uid_member', createdAt: now, updatedAt: now },
        incomingData: { ownerId: 'uid_member', createdAt: now, updatedAt: '2099-01-01T00:00:00.000Z' },
      },
    },
    {
      name: '9. Orphaned Wellness Log Write',
      req: {
        collection: 'wellnessLogs',
        docId: 'uid_orphan',
        operation: 'create',
        auth: { uid: 'uid_orphan', email: 'orphan@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        profileExistsForUid: false,
        incomingData: { ownerId: 'uid_orphan', createdAt: now, updatedAt: now },
      },
    },
    {
      name: '10. Denial-of-Wallet String Poisoning',
      req: {
        collection: 'profiles',
        docId: 'uid_member',
        operation: 'update',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        existingData: baseProfile,
        incomingData: { ...baseProfile, fullName: 'X'.repeat(5000) },
      },
    },
    {
      name: '11. Path ID Poisoning',
      req: {
        collection: 'profiles',
        docId: 'bad$id!with/slashes',
        operation: 'get',
        auth: { uid: 'bad$id!with/slashes', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
      },
    },
    {
      name: '12. Unauthorized Domain Whitelist Tampering',
      req: {
        collection: 'domainSettings',
        docId: 'global',
        operation: 'update',
        auth: { uid: 'uid_member', email: 'member@hbplus.fit', email_verified: true },
        requestTimeIso: now,
        incomingData: { updatedByUid: 'uid_member', allowedDomains: ['evil.com'] },
      },
    },
  ];

  for (const testCase of dirtyDozen) {
    const verdict = evaluateFirestoreRule(testCase.req);
    if (verdict !== 'PERMISSION_DENIED') {
      throw new Error(`Security failure on ${testCase.name}: expected PERMISSION_DENIED, got ${verdict}`);
    }
  }
}
