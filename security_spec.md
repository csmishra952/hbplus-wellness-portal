# HB+ Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants
1. **Identity & Ownership**: A `profiles/{userId}` document can only be created when `userId == request.auth.uid`, `incoming().uid == request.auth.uid`, and `request.auth.token.email_verified == true`.
2. **Privilege Escalation Prevention**: Standard users cannot self-assign `role: "admin"` upon profile creation or mutate `role`, `uid`, `email`, or `createdAt` during profile updates.
3. **PII Isolation**: Reading `profiles/{userId}` (which contains `email`) is strictly restricted to the document owner (`userId == request.auth.uid`) or verified administrators (`isAdmin()`). Blanket `isSignedIn()` reads are prohibited.
4. **Relational Sync**: A `wellnessLogs/{logId}` document cannot be created unless `logId == request.auth.uid`, `incoming().ownerId == request.auth.uid`, and `exists(/databases/$(database)/documents/profiles/$(request.auth.uid))` evaluates to true.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must strictly equal server `request.time` on creation, `createdAt` is immutable on update, and `updatedAt == request.time` on every update.
6. **Bounded Arrays & Strings**: Every string enforces `maxLength` constraints matching `firebase-blueprint.json`, IDs match `^[a-zA-Z0-9_\-]+$`, and `domainSettings.allowedDomains` is bounded to `1..10` items with element type validation.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Assigned Admin Escalation**: `POST /profiles/uid_attacker` with `{ role: "admin" }` by a non-admin user. -> `PERMISSION_DENIED`
2. **Cross-User Profile Spoofing**: `POST /profiles/uid_victim` with `{ uid: "uid_victim" }` while authenticated as `uid_attacker`. -> `PERMISSION_DENIED`
3. **Unverified Email Spoof Attack**: Authenticated as `csmishra952@gmail.com` with `email_verified: false` attempting admin read/write. -> `PERMISSION_DENIED`
4. **PII Blanket Read Scrape**: Authenticated `uid_attacker` executing `GET /profiles/uid_victim` or unfiltered `LIST /profiles`. -> `PERMISSION_DENIED`
5. **Shadow Update (Ghost Field Injection)**: `PATCH /profiles/uid_owner` with `{ fullName: "Alex", isSuperAdmin: true }`. -> `PERMISSION_DENIED`
6. **Role Mutation on Update**: `PATCH /profiles/uid_owner` changing `role` from `"user"` to `"admin"`. -> `PERMISSION_DENIED`
7. **Immortal Timestamp Tampering**: `PATCH /profiles/uid_owner` modifying `createdAt` to a past timestamp. -> `PERMISSION_DENIED`
8. **Client-Forged Future `updatedAt`**: `PATCH /wellnessLogs/uid_owner` setting `updatedAt` to `2099-01-01T00:00:00Z` instead of `request.time`. -> `PERMISSION_DENIED`
9. **Orphaned Wellness Log Write**: `POST /wellnessLogs/uid_no_profile` when `/profiles/uid_no_profile` does not exist. -> `PERMISSION_DENIED`
10. **Denial-of-Wallet 1MB String Poisoning**: `PATCH /profiles/uid_owner` with `fullName` of 50,000 characters (`> 100`). -> `PERMISSION_DENIED`
11. **Path ID Poisoning**: `GET /profiles/bad$id!with/slashes` failing `^[a-zA-Z0-9_\-]+$`. -> `PERMISSION_DENIED`
12. **Unauthorized Domain Whitelist Tampering**: Non-admin user updating `/domainSettings/global` to add `evil.com`. -> `PERMISSION_DENIED`
