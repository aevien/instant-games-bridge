import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // Это указывает Vite, что все пути должны быть относительно текущего каталога
  build: {
    outDir: 'C:/inetpub/wwwroot/Games/InstantGameBridge',
    rollupOptions: {
      output: {
        // Указываем подкаталог без ведущего /
        entryFileNames: `js/instant-games-bridge.js`,
        chunkFileNames: `js/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      }
    }
  }
});