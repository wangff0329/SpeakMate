/// <reference types="vite/client" />

declare module "*.css";
declare module "*.jpg" {
  const src: string;
  export default src;
}
