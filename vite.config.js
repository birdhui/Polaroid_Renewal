import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // import 경로를 '@/components/...' 형태로 통일
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 3D 모델(.glb/.gltf)과 HDR 환경맵을 import 해서 쓸 수 있도록 에셋으로 인식
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
});
