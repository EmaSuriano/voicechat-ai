# 🚀 Release Guide for VoiceChat AI

This document explains how to create releases for VoiceChat AI using the automated GitHub Actions workflows.

## 📋 Prerequisites

1. **GitHub Repository**: Your project must be pushed to GitHub
2. **GitHub Token**: Workflows use `GITHUB_TOKEN` (automatically provided by GitHub Actions)
3. **Icons** (optional): Add icon files to `assets/` directory for branded releases

## 🔄 Automated Release Workflows

### 1. CI Workflow (`ci.yml`)

- **Trigger**: Every push to `main`/`master`/`develop` branches and PRs
- **Purpose**: Continuous testing and validation
- **Runs**: Linting, testing, and build verification on multiple platforms

### 2. Release Workflow (`forge-release.yml`)

- **Trigger**: Git tags matching `v*.*.*` pattern (e.g., `v1.0.0`)
- **Purpose**: Build and publish releases to GitHub
- **Platforms**: macOS, Windows, Linux

### 3. Build & Release Workflow (`build-and-release.yml`)

- **Trigger**: Version tags or manual dispatch
- **Purpose**: Comprehensive multi-platform builds with artifacts
- **Features**: Automatic release creation, asset uploads

## 📦 Creating a Release

### Method 1: Using Git Tags (Recommended)

1. **Update version in package.json**:

   ```bash
   npm version patch  # for bug fixes (1.0.0 → 1.0.1)
   npm version minor  # for new features (1.0.0 → 1.1.0)
   npm version major  # for breaking changes (1.0.0 → 2.0.0)
   ```

2. **Push the tag**:

   ```bash
   git push && git push --tags
   ```

3. **Automated workflow runs** and creates GitHub release with built packages

### Method 2: Using the Release Script

```bash
npm run release  # Increments patch version and pushes tags
```

### Method 3: Manual GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Create a tag (e.g., `v1.0.0`)
4. The workflow will automatically build and attach files

## 🛠️ Manual Building

### Build for Current Platform

```bash
npm run make
```

### Build for All Platforms

```bash
npm run build:all
```

### Package Only (No Distributables)

```bash
npm run package
```

## 📁 Release Artifacts

The workflows automatically create the following artifacts:

### macOS

- `.app` bundle (in ZIP)
- `.dmg` installer

### Windows

- `.exe` installer (via Squirrel)

### Linux

- `.deb` package (Ubuntu/Debian)
- `.rpm` package (RedHat/Fedora)

## ⚙️ Configuration

### Updating Repository Info

Edit `forge.config.ts` to match your GitHub repository:

```typescript
publishers: [
  new PublisherGithub({
    repository: {
      owner: 'your-github-username',
      name: 'your-repo-name',
    },
    prerelease: false,
    draft: true,
  }),
];
```

### Adding Icons

1. Add icon files to `assets/` directory:
   - `icon.icns` (macOS)
   - `icon.ico` (Windows)
   - `icon.png` (Linux)

2. Uncomment icon lines in `forge.config.ts`:
   ```typescript
   icon: './assets/icon',
   ```

## 🔧 Troubleshooting

### Build Failures

1. **Check workflow logs** in GitHub Actions tab
2. **Verify dependencies** are correctly installed
3. **Test locally** with `npm run make`

### Permission Issues

- Ensure `GITHUB_TOKEN` has proper permissions
- Check repository settings for Actions permissions

### Missing Icons

- Icons are optional but recommended
- Builds will work without icons (using defaults)
- See `assets/README.md` for icon creation guide

## 📋 Release Checklist

Before creating a release:

- [ ] Update `CHANGELOG.md` (if you have one)
- [ ] Test the application locally
- [ ] Verify all dependencies are up to date
- [ ] Run `npm run lint` to check for issues
- [ ] Update version in `package.json`
- [ ] Create and push git tag
- [ ] Monitor GitHub Actions for successful build
- [ ] Test downloaded packages on different platforms

## 🚀 Publishing to App Stores

Currently configured for GitHub Releases. To publish to app stores:

### Windows Store

- Add Windows Store publisher to `forge.config.ts`
- Configure Windows Store credentials

### Mac App Store

- Add Mac App Store publisher
- Configure Apple Developer credentials
- Set up code signing

### Snap Store (Linux)

- Add Snap publisher configuration
- Set up Snap Store credentials

## 📞 Support

If you encounter issues with releases:

1. Check the GitHub Actions logs
2. Review the Electron Forge documentation
3. Open an issue in the repository

---

Happy releasing! 🎉
