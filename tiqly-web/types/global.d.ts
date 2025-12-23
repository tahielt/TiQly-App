// Global declarations for non-TS imports (CSS, images, etc.)
// Helps TypeScript accept imports like `import 'leaflet/dist/leaflet.css'`

declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.less";
declare module "*.styl";
declare module "*.svg" {
  const content: any;
  export default content;
}
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.webp";

// If you want, expand this with actual typings for assets
// or use `@types` libraries for SVG React components
