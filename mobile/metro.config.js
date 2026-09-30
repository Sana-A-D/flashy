const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure project root and asset watch folders point to the mobile folder
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

// Disable symlink resolution — OneDrive marks files as NTFS reparse points
// which causes Metro's readlink() call to fail with EINVAL on Windows.
config.resolver = {
  ...config.resolver,
  unstable_enableSymlinks: false,
};

module.exports = config;
