# Wildcard CORS on API

**Severity:** MEDIUM  
**Confidence:** 10/10  
**Repo:** Gen-Con-Buddy-API  
**File:** `internal/api/service.go:53`

## Problem

```go
Handler: cors.AllowAll().Handler(restful.DefaultContainer),
```

`AllowAll()` permits cross-origin requests from any origin. The API is currently read-only and public, but this removes the browser's same-origin enforcement entirely — any page on the web can freely query the API on behalf of visitors. If any write endpoints are added in the future this becomes a CSRF risk.

## Fix

```go
corsHandler := cors.New(cors.Options{
    AllowedOrigins: []string{"https://genconbuddy.com", "http://localhost:5173"},
    AllowedMethods: []string{"GET"},
})
Handler: corsHandler.Handler(restful.DefaultContainer),
```
