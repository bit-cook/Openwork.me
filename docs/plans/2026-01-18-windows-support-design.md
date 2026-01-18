# Windows Support Design

Add production-ready Windows support with full feature parity, code signing, and CI/CD.

## Decisions

| Decision | Choice |
|----------|--------|
| Scope | Production-ready with full parity |
| Code signing | Standard OV certificate |
| Installer | NSIS (.exe) only |
| Bash script | Rewrite as Node.js |
| CI runner | GitHub-hosted `windows-latest` |
| Architecture | x64 only |
| System path utility | Skip for now |
| Testing | Full E2E parity |

## Build Configuration

**electron-builder (`package.json`):**

```json
"win": {
  "target": ["nsis"],
  "icon": "resources/icon.ico",
  "artifactName": "${productName}-${version}-win-${arch}.${ext}"
},
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true
}
```

**npm scripts:**

```json
"package:win": "pnpm build && node scripts/package.cjs --win --x64 --publish never",
"release:win": "pnpm build && node scripts/package.cjs --win --x64 --publish always"
```

**Node.js binaries:** Add `win32-x64` to `scripts/download-nodejs.cjs`.

**asar unpack:** Add `node_modules/opencode-ai/bin/opencode.exe`.

**Icon:** Create `resources/icon.ico` from existing PNG.

## Dev-Browser Server Rewrite

Replace `server.sh` with cross-platform `server.js`:

**File:** `skills/dev-browser/server.js`

```js
#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const skillDir = __dirname;
const npxPath = process.env.NODE_BIN_PATH
  ? path.join(process.env.NODE_BIN_PATH, process.platform === 'win32' ? 'npx.cmd' : 'npx')
  : 'npx';

const args = ['-y', '@anthropic-ai/claude-server@latest', '--mcp-config', './mcp-config.json'];

const child = spawn(npxPath, args, {
  cwd: skillDir,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('error', (err) => console.error('Server failed:', err));
```

**task-manager.ts:** Spawn with node instead of bash:

```ts
const serverScript = path.join(skillsPath, 'dev-browser', 'server.js');
const nodeExe = bundledPaths?.nodePath || 'node';
spawn(nodeExe, [serverScript], { ... })
```

**config-generator.ts:** Update system prompt to `node server.js`.

**Delete:** `server.sh` (no backwards compatibility needed).

## Platform-Specific Fixes

**cli-path.ts** - Add Windows dev paths:

```ts
const globalOpenCodePaths = process.platform === 'win32'
  ? [
      path.join(process.env.LOCALAPPDATA || '', 'npm', 'opencode.cmd'),
      path.join(process.env.APPDATA || '', 'npm', 'opencode.cmd'),
    ]
  : [
      '/usr/local/bin/opencode',
      '/opt/homebrew/bin/opencode',
    ];
```

**package.json clean script** - Use cross-platform approach (rimraf or node -e).

**Already Windows-ready (no changes):**
- `bundled-node.ts` - handles `.exe`/`.cmd` extensions
- `adapter.ts` - PowerShell quoting, PATH delimiter
- `after-pack.cjs` - Windows platform mapping
- `system-path.ts` - returns base PATH on Windows (acceptable)

## CI/CD Configuration

**release.yml** - Matrix strategy:

```yaml
strategy:
  matrix:
    include:
      - os: macos-14
        platform: mac
        arch: arm64
      - os: windows-latest
        platform: win
        arch: x64
```

**Windows signing secrets (add when certificate acquired):**
- `WIN_CSC_LINK` - Base64-encoded .pfx
- `WIN_CSC_KEY_PASSWORD` - Certificate password

**ci.yml** - Add Windows to E2E matrix:

```yaml
e2e-tests:
  strategy:
    matrix:
      os: [macos-latest, windows-latest]
```

## Files Summary

**New:**
- `skills/dev-browser/server.js`
- `resources/icon.ico`

**Delete:**
- `skills/dev-browser/server.sh`

**Modify:**
- `apps/desktop/package.json` - win/nsis config, scripts
- `scripts/download-nodejs.cjs` - win32-x64 platform
- `src/main/opencode/task-manager.ts` - spawn server.js
- `src/main/opencode/config-generator.ts` - system prompt
- `src/main/opencode/cli-path.ts` - Windows paths
- `.github/workflows/release.yml` - Windows matrix
- `.github/workflows/ci.yml` - Windows E2E

## Implementation Order

**Phase 1 - Core (building):**
1. Add `win32-x64` to download script
2. Create `icon.ico`
3. Add win/nsis config to package.json
4. Add `package:win` script
5. Test local build

**Phase 2 - Server (running):**
1. Create `server.js`
2. Update `task-manager.ts`
3. Update `config-generator.ts`
4. Delete `server.sh`
5. Test task execution

**Phase 3 - Polish:**
1. Fix `cli-path.ts`
2. Fix `clean` script
3. Manual testing

**Phase 4 - CI/CD:**
1. Update `release.yml`
2. Update `ci.yml`
3. Add signing secret placeholders
4. Verify CI passes

**Phase 5 - Code signing:**
1. Purchase OV certificate
2. Add secrets
3. Test signed build
