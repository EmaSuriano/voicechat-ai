import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'VoiceChat AI',
    executableName: 'voicechat-ai',
    appBundleId: 'com.emanuelsiuriano.voicechat-ai',
    appCategoryType: 'public.app-category.productivity',
    // icon: './assets/icon', // Uncomment when you add icon files
    protocols: [
      {
        name: 'VoiceChat AI',
        schemes: ['voicechat-ai'],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'VoiceChat AI',
      setupExe: 'VoiceChatAI-Setup.exe',
      // setupIcon: './assets/icon.ico' // Uncomment when you add icon files
    }),
    new MakerDMG({
      name: 'VoiceChat AI',
      // icon: './assets/icon.icns', // Uncomment when you add icon files
      format: 'ULFO',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        name: 'voicechat-ai',
        productName: 'VoiceChat AI',
        genericName: 'AI Chat Application',
        description:
          'A modern desktop AI chat application with voice-to-text capabilities',
        categories: ['Office', 'Network'],
      },
    }),
    new MakerDeb({
      options: {
        name: 'voicechat-ai',
        productName: 'VoiceChat AI',
        genericName: 'AI Chat Application',
        description:
          'A modern desktop AI chat application with voice-to-text capabilities',
        categories: ['Office', 'Network'],
        maintainer: 'Emanuel Suriano',
        homepage: 'https://github.com/emanuelsiuriano/voicechat-ai',
      },
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'EmaSuriano',
        name: 'voicechat-ai',
      },
      prerelease: false,
      draft: false, // Changed to false so releases are published immediately
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
