/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Workaround TipTap subpath export resolution in some bundler setups
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@tiptap/pm/keymap': require.resolve('prosemirror-keymap'),
      '@tiptap/pm/transform': require.resolve('prosemirror-transform'),
      '@tiptap/pm/commands': require.resolve('prosemirror-commands'),
    };
    return config;
  },
};

module.exports = nextConfig;
