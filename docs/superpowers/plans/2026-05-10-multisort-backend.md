# Multisort Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Gen-Con-Buddy API to accept comma-separated multi-sort params (e.g. `?sort=startDateTime.asc,title.desc`).

**Architecture:** Add a `SortEntry` struct and `ParseSorts` helper to the event package. Replace `SearchRequest.SortField`/`SortDir` with `Sorts []SortEntry`. Update the handler to call `ParseSorts`, and the repo to build the full OpenSearch sort array.

**Tech Stack:** Go, OpenSearch, `github.com/stretchr/testify/require`

---

## File Map

| File                            | Change                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `internal/event/search.go`      | Add `SortEntry` struct, `ParseSorts` func; replace `SortField`/`SortDir` in `SearchRequest` with `Sorts []SortEntry` |
| `internal/event/search_test.go` | Add `TestParseSorts` table test                                                                                      |
| `internal/api/event_handler.go` | Update `case "sort":` to call `event.ParseSorts`                                                                     |
| `internal/event/repo.go`        | Update `Search` to iterate `req.Sorts` and build multi-entry sort array                                              |

---

## Task 1: Add `SortEntry`, `ParseSorts`, and update `SearchRequest`

**Files:**

- Modify: `internal/event/search.go`

- [ ] **Step 1: Add `SortEntry` type and `ParseSorts` function**

Open `internal/event/search.go`. After the `ParseSort` function (line ~121), add:

```go
// SortEntry represents a single field+direction sort pair.
type SortEntry struct {
	Field Field
	Dir   string
}

// ParseSorts parses a comma-separated list of "{field}.{asc|desc}" sort tokens.
// Empty tokens are skipped. Returns an error on the first invalid token.
func ParseSorts(s string) ([]SortEntry, error) {
	var sorts []SortEntry
	for _, token := range strings.Split(s, ",") {
		token = strings.TrimSpace(token)
		if token == "" {
			continue
		}
		field, dir, err := ParseSort(token)
		if err != nil {
			return nil, err
		}
		sorts = append(sorts, SortEntry{Field: field, Dir: dir})
	}
	return sorts, nil
}
```

- [ ] **Step 2: Update `SearchRequest` to use `[]SortEntry`**

In `SearchRequest` (around line 12), replace the two sort fields:

```go
// Before
type SearchRequest struct {
	Terms     []search.Term
	Page      int
	Limit     int
	SortField Field
	SortDir   string
}

// After
type SearchRequest struct {
	Terms []search.Term
	Page  int
	Limit int
	Sorts []SortEntry
}
```

- [ ] **Step 3: Verify the package compiles (handler and repo will fail — fix them next)**

```bash
cd /path/to/Gen-Con-Buddy-API
go build ./...
```

Expected: compilation errors in `internal/api/event_handler.go` and `internal/event/repo.go` referencing `SortField`/`SortDir`. These are fixed in the next tasks.

---

## Task 2: Update the event handler

**Files:**

- Modify: `internal/api/event_handler.go`

- [ ] **Step 1: Replace the `case "sort":` block**

Find the `case "sort":` block (around line 123). Replace it entirely:

```go
case "sort":
    if len(values) > 1 {
        resp.WriteHeader(http.StatusBadRequest)
        response.Error = &gcbapi.Error{
            Status: "bad request",
            Detail: "only 1 sort query parameter is allowed",
        }
        return
    }
    sorts, err := event.ParseSorts(values[0])
    if err != nil {
        resp.WriteHeader(http.StatusBadRequest)
        response.Error = &gcbapi.Error{
            Status: "bad request",
            Detail: fmt.Errorf("invalid sort param: %w", err).Error(),
        }
        return
    }
    searchReq.Sorts = append(searchReq.Sorts, sorts...)
```

- [ ] **Step 2: Verify handler compiles**

```bash
go build ./internal/api/...
```

Expected: compiles without error.

---

## Task 3: Update the repo to build a multi-entry sort array

**Files:**

- Modify: `internal/event/repo.go`

- [ ] **Step 1: Replace the single-sort logic in `Search`**

Find the sort section in the `Search` method (around line 194). Replace the block that builds `sortField`/`sortDir` and the `searchBody["sort"]` entry:

```go
// Before
sortField := "startDateTime"
sortDir := "asc"
if req.SortField != "" {
    sortField = string(req.SortField)
    sortDir = req.SortDir
    if _, isText := textSortFields[req.SortField]; isText {
        sortField = sortField + ".keyword"
    }
}

searchBody := map[string]any{
    "track_total_hits": true,
    "size":             req.Limit,
    "from":             req.Limit * req.Page,
    "sort": []any{
        map[string]any{
            sortField: map[string]any{"order": sortDir},
        },
    },
}
```

```go
// After
sortEntries := make([]any, 0, len(req.Sorts))
for _, s := range req.Sorts {
    fieldName := string(s.Field)
    if _, isText := textSortFields[s.Field]; isText {
        fieldName = fieldName + ".keyword"
    }
    sortEntries = append(sortEntries, map[string]any{
        fieldName: map[string]any{"order": s.Dir},
    })
}
if len(sortEntries) == 0 {
    sortEntries = []any{
        map[string]any{"startDateTime": map[string]any{"order": "asc"}},
    }
}

searchBody := map[string]any{
    "track_total_hits": true,
    "size":             req.Limit,
    "from":             req.Limit * req.Page,
    "sort":             sortEntries,
}
```

- [ ] **Step 2: Verify full build**

```bash
go build ./...
```

Expected: clean build, no errors.

---

## Task 4: Add tests for `ParseSorts` and run the full suite

**Files:**

- Modify: `internal/event/search_test.go`

- [ ] **Step 1: Add `TestParseSorts` table test**

Append after the existing `TestParseSort` test:

```go
func TestParseSorts(t *testing.T) {
    tests := []struct {
        name      string
        input     string
        wantSorts []SortEntry
        wantErr   bool
    }{
        {
            name:      "single field asc",
            input:     "startDateTime.asc",
            wantSorts: []SortEntry{{Field: StartDateTime, Dir: "asc"}},
        },
        {
            name:  "two fields",
            input: "startDateTime.asc,title.desc",
            wantSorts: []SortEntry{
                {Field: StartDateTime, Dir: "asc"},
                {Field: Title, Dir: "desc"},
            },
        },
        {
            name:  "three fields",
            input: "cost.asc,title.asc,startDateTime.desc",
            wantSorts: []SortEntry{
                {Field: Cost, Dir: "asc"},
                {Field: Title, Dir: "asc"},
                {Field: StartDateTime, Dir: "desc"},
            },
        },
        {
            name:      "empty string returns nil slice",
            input:     "",
            wantSorts: nil,
        },
        {
            name:    "invalid field returns error",
            input:   "startDateTime.asc,bogus.asc",
            wantErr: true,
        },
        {
            name:    "invalid direction returns error",
            input:   "startDateTime.up",
            wantErr: true,
        },
        {
            name:  "whitespace around commas is trimmed",
            input: "startDateTime.asc , title.desc",
            wantSorts: []SortEntry{
                {Field: StartDateTime, Dir: "asc"},
                {Field: Title, Dir: "desc"},
            },
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseSorts(tt.input)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            require.Equal(t, tt.wantSorts, got)
        })
    }
}
```

- [ ] **Step 2: Run the full test suite**

```bash
go test ./...
```

Expected: all tests pass. The existing `TestParseSort` continues to pass unchanged.

- [ ] **Step 3: Commit**

```bash
git add internal/event/search.go internal/event/search_test.go internal/api/event_handler.go internal/event/repo.go
git commit -m "feat: support comma-separated multisort param"
```
