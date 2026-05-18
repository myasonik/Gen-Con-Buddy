# TLS Certificate Verification Disabled in API

**Severity:** MEDIUM  
**Confidence:** 10/10  
**Repo:** Gen-Con-Buddy-API  
**File:** `cmd/app/app.go:47-49`

## Problem

```go
TLSClientConfig: &tls.Config{
    InsecureSkipVerify: true,
},
```

Certificate validation on the API→OpenSearch connection is disabled unconditionally, including in production on Railway. A network-level MITM could intercept all search queries and responses.

## Fix

Gate on an env var so production validates certs and only local dev skips verification:

```go
insecure := os.Getenv("OS_INSECURE_TLS") == "true"
TLSClientConfig: &tls.Config{InsecureSkipVerify: insecure}
```

Set `OS_INSECURE_TLS=true` in local `.env` only; leave it unset in Railway.
