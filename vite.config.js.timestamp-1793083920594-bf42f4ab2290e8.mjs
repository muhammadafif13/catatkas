// vite.config.js
import { defineConfig } from "file:///D:/catatkas/node_modules/vite/dist/node/index.js";
import react from "file:///D:/catatkas/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///D:/catatkas/node_modules/vite-plugin-pwa/dist/index.js";
var iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
var vite_config_default = defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "CatatKas \u2014 Catatan Keuangan Pribadi",
        short_name: "CatatKas",
        description: "Catat pemasukan, pengeluaran, budget, dan dompet dengan sinkronisasi cloud, akses multi-perangkat, serta mode baca offline.",
        lang: "id",
        dir: "ltr",
        theme_color: "#6366f1",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["finance", "productivity", "utilities"],
        icons: [
          ...iconSizes.map((size) => ({
            src: `icons/icon-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: "image/png",
            purpose: "any"
          })),
          {
            src: "icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxjYXRhdGthc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcY2F0YXRrYXNcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2NhdGF0a2FzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbmNvbnN0IGljb25TaXplcyA9IFs3MiwgOTYsIDEyOCwgMTQ0LCAxNTIsIDE5MiwgMzg0LCA1MTJdO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnLycsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uc3ZnJywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBpZDogJy8nLFxuICAgICAgICBuYW1lOiAnQ2F0YXRLYXMgXHUyMDE0IENhdGF0YW4gS2V1YW5nYW4gUHJpYmFkaScsXG4gICAgICAgIHNob3J0X25hbWU6ICdDYXRhdEthcycsXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICdDYXRhdCBwZW1hc3VrYW4sIHBlbmdlbHVhcmFuLCBidWRnZXQsIGRhbiBkb21wZXQgZGVuZ2FuIHNpbmtyb25pc2FzaSBjbG91ZCwgYWtzZXMgbXVsdGktcGVyYW5na2F0LCBzZXJ0YSBtb2RlIGJhY2Egb2ZmbGluZS4nLFxuICAgICAgICBsYW5nOiAnaWQnLFxuICAgICAgICBkaXI6ICdsdHInLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyM2MzY2ZjEnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzBmMTcyYScsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBjYXRlZ29yaWVzOiBbJ2ZpbmFuY2UnLCAncHJvZHVjdGl2aXR5JywgJ3V0aWxpdGllcyddLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIC4uLmljb25TaXplcy5tYXAoKHNpemUpID0+ICh7XG4gICAgICAgICAgICBzcmM6IGBpY29ucy9pY29uLSR7c2l6ZX14JHtzaXplfS5wbmdgLFxuICAgICAgICAgICAgc2l6ZXM6IGAke3NpemV9eCR7c2l6ZX1gLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55JyxcbiAgICAgICAgICB9KSksXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaWNvbnMvbWFza2FibGUtaWNvbi01MTJ4NTEyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgd29ya2JveDoge1xuICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsc3ZnLHBuZyx3b2ZmLHdvZmYyfSddLFxuICAgICAgICBjbGVhbnVwT3V0ZGF0ZWRDYWNoZXM6IHRydWUsXG4gICAgICAgIGNsaWVudHNDbGFpbTogdHJ1ZSxcbiAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA2ICogMTAyNCAqIDEwMjQsXG4gICAgICB9LFxuICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzMsXG4gICAgaG9zdDogdHJ1ZSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgaG9zdDogdHJ1ZSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1TixTQUFTLG9CQUFvQjtBQUNwUCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBRXhCLElBQU0sWUFBWSxDQUFDLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLEtBQUssR0FBRztBQUV2RCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsZUFBZSxzQkFBc0I7QUFBQSxNQUNyRCxVQUFVO0FBQUEsUUFDUixJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUNFO0FBQUEsUUFDRixNQUFNO0FBQUEsUUFDTixLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsUUFDYixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxZQUFZLENBQUMsV0FBVyxnQkFBZ0IsV0FBVztBQUFBLFFBQ25ELE9BQU87QUFBQSxVQUNMLEdBQUcsVUFBVSxJQUFJLENBQUMsVUFBVTtBQUFBLFlBQzFCLEtBQUssY0FBYyxJQUFJLElBQUksSUFBSTtBQUFBLFlBQy9CLE9BQU8sR0FBRyxJQUFJLElBQUksSUFBSTtBQUFBLFlBQ3RCLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNYLEVBQUU7QUFBQSxVQUNGO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxjQUFjLENBQUMsdUNBQXVDO0FBQUEsUUFDdEQsdUJBQXVCO0FBQUEsUUFDdkIsY0FBYztBQUFBLFFBQ2QsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsK0JBQStCLElBQUksT0FBTztBQUFBLE1BQzVDO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
