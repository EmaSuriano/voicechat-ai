# 🤖 Automated Release System

VoiceChat AI now has a fully automated release system that creates releases based on your commits and version changes.

## 🚀 How It Works

### Method 1: Automatic Version Bumping (Recommended)

The system automatically bumps versions and creates releases based on your commit messages:

#### **Patch Release** (1.0.0 → 1.0.1)
```bash
git commit -m "fix: resolve chat interface bug"
git push
```

#### **Minor Release** (1.0.0 → 1.1.0)
```bash
git commit -m "feat: add new voice recognition feature"
# or
git commit -m "[minor] improve user interface"
git push
```

#### **Major Release** (1.0.0 → 2.0.0)
```bash
git commit -m "feat!: redesign entire application [major]"
# or
git commit -m "refactor: breaking change to API

BREAKING CHANGE: Complete API redesign"
git push
```

### Method 2: Manual Version Control

Update the version in `package.json` and push:

```bash
# Update package.json version manually, then:
git add package.json
git commit -m "chore: bump version to v1.2.0"
git push
```

### Method 3: NPM Scripts

Use the provided npm scripts:

```bash
npm run release:patch  # 1.0.0 → 1.0.1
npm run release:minor  # 1.0.0 → 1.1.0  
npm run release:major  # 1.0.0 → 2.0.0
```

## 🎯 Commit Message Conventions

### **Automatic Version Detection**

| Commit Message Pattern | Version Bump | Example |
|------------------------|--------------|---------|
| `fix:`, `bugfix:`, `patch:` | **Patch** | `fix: resolve memory leak` |
| `feat:`, `feature:`, `[minor]` | **Minor** | `feat: add dark mode` |
| `[major]`, `BREAKING CHANGE` | **Major** | `feat!: new API [major]` |
| Other commits | **Patch** | `improve documentation` |

### **Skip Automation**

Add these flags to skip automatic processing:

- `[skip version]` - Skip version bumping
- `[skip release]` - Skip entire release process
- `[skip ci]` - Skip CI/CD workflows

```bash
git commit -m "docs: update README [skip release]"
```

## 🔄 Workflow Process

When you push to `main`/`master`:

1. **🔍 Auto-Version Workflow**
   - Analyzes commit message
   - Bumps version in `package.json`
   - Commits version change
   - Creates git tag

2. **🏗️ Release Workflows** (triggered by tag)
   - Builds for macOS, Windows, Linux
   - Creates GitHub Release
   - Uploads installation files

3. **📦 Available Downloads**
   - macOS: `.dmg` installers
   - Windows: `.exe` installer  
   - Linux: `.deb` and `.rpm` packages

## ⏱️ Timeline

- **Immediate**: Version bump and tag creation
- **5-10 minutes**: Platform builds complete
- **15-20 minutes**: Release available with downloads

## 🛠️ Configuration

### **Ignored Files**

These file changes won't trigger releases:
- `README.md`, `*.md` files
- Documentation in `docs/`
- GitHub workflow files
- `CHANGELOG.md`

### **Branch Protection**

Only pushes to these branches trigger releases:
- `main`
- `master`

## 📋 Examples

### **Bug Fix Release**
```bash
git add .
git commit -m "fix: resolve chat scrolling issue"
git push
# → Creates v1.0.1 automatically
```

### **Feature Release**
```bash
git add .
git commit -m "feat: add export chat history feature"  
git push
# → Creates v1.1.0 automatically
```

### **Breaking Change Release**
```bash
git add .
git commit -m "refactor: redesign settings API [major]"
git push  
# → Creates v2.0.0 automatically
```

### **Documentation Update (No Release)**
```bash
git add .
git commit -m "docs: improve installation guide [skip release]"
git push
# → No version bump or release created
```

## 🔧 Manual Override

If you need to manually control versions:

1. **Edit `package.json`** version field
2. **Commit and push** changes  
3. **System detects** version change
4. **Creates tag** and release automatically

## 📊 Monitoring

### **Check Release Status**

1. **GitHub Actions**: View workflow progress
2. **GitHub Releases**: See published releases
3. **Tags**: View created version tags

### **Workflow Files**

- `.github/workflows/auto-version.yml` - Automatic version bumping
- `.github/workflows/auto-release.yml` - Manual version detection
- `.github/workflows/forge-release.yml` - Release building
- `.github/workflows/ci.yml` - Testing and validation

## 🚨 Troubleshooting

### **Release Not Created**

- Check commit message doesn't contain `[skip release]`
- Verify push was to `main`/`master` branch
- Check GitHub Actions for error messages

### **Version Not Bumped**

- Ensure commit message follows conventions
- Check for `[skip version]` flag
- Verify `package.json` wasn't already at that version

### **Build Failures**

- Check GitHub Actions logs
- Verify all tests pass in CI
- Ensure no linting errors

---

🎉 **Enjoy automated releases!** Just commit your changes and let the system handle versioning and distribution.
