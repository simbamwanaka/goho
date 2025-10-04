# ivhu — local dev server and admin panel

This project contains a simple Node.js backend and an admin panel for the Goho Hub site.

Quick start (Windows / PowerShell):

1. Install dependencies

```powershell
cd "E:\Web Dev\ivhu"
npm install
```

2. Start the server

```powershell
npm start
# open http://localhost:3000 in your browser
# admin UI is available at http://localhost:3000/admin (default credentials: admin / admin)
```

Notes:
- This uses an in-memory store. For production, replace with a database.
- Images referenced in the server store point to `/images/...` — either add an `images` folder or use full external URLs.
