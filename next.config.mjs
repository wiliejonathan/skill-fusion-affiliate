/** @type {import("next").NextConfig} */
const basePath=(process.env.NEXT_PUBLIC_BASE_PATH??"/skill-fusion-affiliate")+"";
export default {reactStrictMode:true,output:"export",basePath,trailingSlash:true,images:{unoptimized:true}};
