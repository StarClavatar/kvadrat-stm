import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения для текущего режима
  const env = loadEnv(mode, process.cwd(), '')
  
  const proxyConfig = {
    proxy: {
      '/api': {
        target: 'https://ts4',
        changeOrigin: true,
        secure: false, // Игнорируем SSL сертификаты
        rewrite: (path) => path.replace(/^\/api/, '/sed_work_nopass/hs/data'),
      },
    },
  };
  
  return {
    plugins: [react()],
    // Подставляем переменные в код
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
    },
    server: {
      // Прокси для dev сервера
      ...((!env.VITE_API_BASE_URL || env.VITE_API_BASE_URL === '') && proxyConfig),
    },
    preview: {
      // Прокси для preview режима тоже
      ...((!env.VITE_API_BASE_URL || env.VITE_API_BASE_URL === '') && proxyConfig),
    },
  }
})
