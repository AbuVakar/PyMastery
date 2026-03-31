#!/usr/bin/env python3
"""
Quick Fix Script for PyMastery Frontend Errors
This script fixes common TypeScript/JSX syntax errors
"""

import os
import re
from pathlib import Path

class FrontendErrorFixer:
    def __init__(self, frontend_path: str):
        self.frontend_path = Path(frontend_path)
        self.fixes_applied = []
        
    def fix_all_errors(self):
        """Fix all frontend errors"""
        print("🔧 PyMastery Frontend Error Fixer")
        print("=" * 50)
        
        # Fix MicroLearningPlatform.tsx
        self.fix_micro_learning_platform()
        
        # Fix EnhancedKPIAnalytics.tsx
        self.fix_enhanced_kpi_analytics()
        
        # Fix AnalyticsDashboard.jsx
        self.fix_analytics_dashboard()
        
        # Fix api_backup.js
        self.fix_api_backup()
        
        # Generate report
        self.generate_report()
    
    def fix_micro_learning_platform(self):
        """Fix MicroLearningPlatform.tsx errors"""
        print("\n📝 Fixing MicroLearningPlatform.tsx:")
        
        file_path = self.frontend_path / "src/components/MicroLearningPlatform.tsx"
        
        if not file_path.exists():
            print("  ❌ File not found")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix missing closing backticks in className
            content = re.sub(
                r'className={`([^`}]*)`([^>]*>)',
                r'className={`\1`}\2',
                content
            )
            
            # Fix object property syntax
            content = re.sub(
                r'(\w+):\s*([^{,}\n]+)\n(?=\s*[}\]])',
                r'\1: \2,\n',
                content
            )
            
            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("  ✅ Fixed MicroLearningPlatform.tsx")
                self.fixes_applied.append("MicroLearningPlatform.tsx: Fixed className and object syntax")
            else:
                print("  ✅ No fixes needed")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    def fix_enhanced_kpi_analytics(self):
        """Fix EnhancedKPIAnalytics.tsx errors"""
        print("\n📊 Fixing EnhancedKPIAnalytics.tsx:")
        
        file_path = self.frontend_path / "src/components/EnhancedKPIAnalytics.tsx"
        
        if not file_path.exists():
            print("  ❌ File not found")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Remove orphaned object properties after useEffect
            content = re.sub(
                r'},\s*\[selectedTimeRange\]\);\s*\n.*?percentage_of_target.*?\n.*?color.*?\n.*?},',
                r'}, [selectedTimeRange]);',
                content,
                flags=re.DOTALL
            )
            
            # Fix missing return statement
            if 'return (' not in content and 'return' not in content:
                # Add basic return statement if missing
                content += '\n\n  return (\n    <div>KPI Analytics</div>\n  );'
            
            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("  ✅ Fixed EnhancedKPIAnalytics.tsx")
                self.fixes_applied.append("EnhancedKPIAnalytics.tsx: Removed orphaned code, added return statement")
            else:
                print("  ✅ No fixes needed")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    def fix_analytics_dashboard(self):
        """Fix AnalyticsDashboard.jsx errors"""
        print("\n📈 Fixing AnalyticsDashboard.jsx:")
        
        file_path = self.frontend_path / "src/pages/AnalyticsDashboard.jsx"
        
        if not file_path.exists():
            print("  ❌ File not found")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix missing commas in object properties
            content = re.sub(
                r'(\w+):\s*([^,}\n]+)\n(?=\s*[}\]})',
                r'\1: \2,\n',
                content
            )
            
            # Fix array syntax
            content = re.sub(
                r'(\w+):\s*\[([^\]]*)\](?!\s*,)',
                r'\1: [\2],',
                content
            )
            
            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("  ✅ Fixed AnalyticsDashboard.jsx")
                self.fixes_applied.append("AnalyticsDashboard.jsx: Fixed object and array syntax")
            else:
                print("  ✅ No fixes needed")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    def fix_api_backup(self):
        """Fix api_backup.js errors"""
        print("\n🔄 Fixing api_backup.js:")
        
        file_path = self.frontend_path / "src/mocks/api_backup.js"
        
        if not file_path.exists():
            print("  ❌ File not found")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Fix export syntax
            content = re.sub(
                r'export const mockAPI = \{',
                r'export const mockAPI = {',
                content
            )
            
            # Fix object property syntax
            content = re.sub(
                r'(\w+):\s*([^{,}\n]+)\n(?=\s*[}\]])',
                r'\1: \2,\n',
                content
            )
            
            # Fix function exports
            content = re.sub(
                r'export const (\w+) = \(\) => \{',
                r'export const \1 = () => {',
                content
            )
            
            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("  ✅ Fixed api_backup.js")
                self.fixes_applied.append("api_backup.js: Fixed export and object syntax")
            else:
                print("  ✅ No fixes needed")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    def generate_report(self):
        """Generate fix report"""
        print("\n" + "=" * 50)
        print("📊 FIX REPORT")
        print("=" * 50)
        
        if self.fixes_applied:
            print(f"✅ Applied {len(self.fixes_applied)} fixes:")
            for i, fix in enumerate(self.fixes_applied, 1):
                print(f"  {i}. {fix}")
        else:
            print("ℹ️  No fixes needed")
        
        print("\n🎯 Next Steps:")
        print("  1. Run 'npm run build' to check if errors are fixed")
        print("  2. Run 'npm run dev' to test the application")
        print("  3. Check browser console for any remaining issues")

def main():
    """Main function"""
    frontend_path = Path(__file__).parent / "frontend"
    
    fixer = FrontendErrorFixer(str(frontend_path))
    fixer.fix_all_errors()

if __name__ == "__main__":
    main()
