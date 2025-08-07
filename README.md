# Secure File-Drop Server

A lightweight Express server that lets you **upload, list, and download files** through a tiny REST API protected by a simple pass-code.  
On every restart it automatically archives the previous `uploads/` directory so you always start with a clean slate.

---

## Features
|                           | Description |
|---------------------------|-------------|
| **Uploads**               | `POST /upload` — multi-file upload via _multipart/form-data_ (`files[]`). |
| **List files**            | `GET /files` — returns a JSON array of filenames currently in `uploads/`. |
| **Download single file**  | `GET /uploads/:filename` — downloads one file. |
| **Download all files**    | `GET /download-all` — streams a ZIP of everything in `uploads/`. |
| **Self-cleaning storage** | On boot the existing `uploads/` folder is renamed to `archive_<timestamp>` and a fresh upload directory is created. |
| **Simple auth**           | All endpoints (except `/`) require the correct pass-code supplied via<br>• `X-Passcode` header **or**<br>• `?passcode=` query string **or**<br>• JSON body field `passcode`. |
| **CORS-friendly**         | Enabled with `cors()` so you can hit the API from any front-end. |
| **Static site**           | Anything inside `public/` (e.g. an `index.html`) is served at `/`. |

---

## Quick start

```bash
npm install
# ┌────────port (default 3001)
# │    ┌───pass-code (fallback 'changeme')
# │    │
node server.js 4000 superSecret123
```
API reference

Method & Path	Body / Params	Success (200)	Notes

POST /upload	multipart/form-data with files[]	{ message: "Files uploaded successfully" }	Pass-code required

GET /files	—	["file1.png","doc.pdf"]	—

GET /uploads/:name	—	Attachment download	—

GET /download-all	—	ZIP stream	—

Authentication options

Header: X-Passcode: superSecret123

Query: ?passcode=superSecret123

JSON body (for POST requests): { "passcode": "superSecret123" }
