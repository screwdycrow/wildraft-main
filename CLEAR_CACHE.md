# Clear Vite Cache

To fix the TipTap table import error, you need to clear Vite's cache:

**Option 1: Delete the cache folder manually**
- Delete the folder: `node_modules/.vite`

**Option 2: Use PowerShell (Windows)**
```powershell
Remove-Item -Recurse -Force node_modules\.vite
```

**Option 3: Use Command Prompt (Windows)**
```cmd
rmdir /s /q node_modules\.vite
```

**Option 4: Use Git Bash or WSL**
```bash
rm -rf node_modules/.vite
```

After clearing the cache, restart your dev server.

