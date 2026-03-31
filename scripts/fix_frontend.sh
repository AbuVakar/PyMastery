#!/bin/bash

echo "🔧 Fixing frontend TypeScript errors..."

# Fix StudyGroups.jsx - add missing closing div
sed -i 's/        <\/div>/        <\/div>\n        <\/div>/g' frontend/src/pages/StudyGroups.jsx

# Fix useAI.ts - add missing semicolons
sed -i 's/  }$/  };/g' frontend/src/hooks/useAI.ts

echo "✅ Frontend fixes applied!"
echo "🚀 Now run: cd frontend && npm run build"
