/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 빌드 시 ESLint 검사 완전히 건너뛰기
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig