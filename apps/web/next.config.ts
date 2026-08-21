import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // I package del monorepo sono TypeScript sorgente, non compilati:
  // Next li transpila insieme all'app.
  transpilePackages: ['@noteaker/core', '@noteaker/ui', '@noteaker/db'],

  // React Compiler: memoizza da solo i componenti, così non serve
  // riempire il codice di useMemo/useCallback (docs/01-architettura.md §2).
  reactCompiler: true,

  typedRoutes: true,
};

export default nextConfig;
