# Fix imports in all router files
import os
import re

# Get all router files
router_files = [f for f in os.listdir('routers') if f.endswith('.py') and f != '__init__.py']

for file in router_files:
    filepath = f'routers/{file}'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace relative imports with absolute imports
    content = re.sub(r'from \.\.database\.mongodb', 'from database.mongodb', content)
    content = re.sub(r'from \.\.services\.', 'from services.', content)
    content = re.sub(r'from \.\.models\.', 'from models.', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed imports in router files")
