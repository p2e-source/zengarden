import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{target:'es2022',chunkSizeWarningLimit:1800,rollupOptions:{output:{manualChunks:{babylon:['@babylonjs/core','@babylonjs/loaders/glTF']}}}}});
