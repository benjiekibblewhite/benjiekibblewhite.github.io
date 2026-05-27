# Security Audit - 2026-05-04

## Critical

### 1. XSS via JavaScript URLs in Source Badges
**File**: `frontend/app.js:417`  
**Issue**: `badge.href = source.list_url` allows `javascript:` URLs  
**Fix**: Validate URLs before assignment
```javascript
if (source.list_url) {
  try {
    const url = new URL(source.list_url);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      badge.href = source.list_url;
    }
  } catch { /* skip */ }
}
```

## High

### 2. No Rate Limiting on Album Requests
**File**: `supabase/functions/request-new-album/index.ts`  
**Issue**: Unlimited requests can DoS database and rack up costs  
**Fix**: Add rate limit check (1 request per minute)
```typescript
const { data: recentRequests } = await supabase
  .from('daily_picks')
  .select('picked_at')
  .eq('user_id', user.id)
  .gte('picked_at', new Date(Date.now() - 60000).toISOString())
  
if (recentRequests?.length > 0) {
  return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })
}
```

### 3. CORS Wildcard
**File**: `supabase/functions/request-new-album/index.ts:8`  
**Issue**: `Access-Control-Allow-Origin: *` allows any site to call function  
**Fix**: Set specific origin
```typescript
'Access-Control-Allow-Origin': 'https://your-actual-domain.com',
```

## Medium

### 4. Verbose Error Messages
**Files**: Multiple edge functions  
**Issue**: Error messages expose database schema  
**Fix**: Return generic errors to client, log details server-side

### 5. User Email in Logs
**File**: `supabase/functions/daily-album-picker/index.ts:142`  
**Issue**: GDPR concern, use user IDs instead  
**Fix**: `console.log(\`Processed user ${user.id}\`)`

### 6. No Review Length Validation
**File**: `frontend/supabase-client.js:88`  
**Issue**: Can submit unlimited text  
**Fix**: Add max length check (5000 chars)

## Low

### 7. No Content Security Policy
**File**: `frontend/index.html`  
**Issue**: No CSP headers to mitigate XSS  
**Fix**: Add CSP meta tag
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co; style-src 'self' 'unsafe-inline';">
```

## Priority Order
1. Fix #1 (XSS) - BEFORE PUBLIC DEPLOYMENT
2. Fix #2 (Rate limiting) - Before production
3. Fix #3 (CORS) - Before production
4. Fix #4-7 - Hardening
