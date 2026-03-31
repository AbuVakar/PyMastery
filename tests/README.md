# PyMastery Test Files

This directory contains test files and debugging utilities that were previously scattered in the root directory.

## 📁 Directory Structure

### `api-tests/`
Contains API testing and debugging files:

- **`test_*.js`** - Various API integration tests
  - `test_fixed_priority.js` - Tests API priority with Gemini first
  - `test_final_integration.js` - Final integration tests
  - `test_gemini_api.js` - Gemini API specific tests
  - `test_groq_api.js` - Groq API specific tests
  - `test_openai_api.js` - OpenAI API specific tests
  - And more...

- **`check_*.js`** - Utility check scripts
- **`check_*.html`** - Browser console testing utilities
- **`debug_*.js`** - Debugging scripts

- **Database Files** (MongoDB temporary files)
  - `WiredTiger*` - MongoDB WiredTiger storage engine files
  - `*.wt` - MongoDB data files
  - `mongod.lock` - MongoDB lock file

## 🧪 Running Tests

### API Tests
```bash
cd tests/api-tests
node test_fixed_priority.js
```

### Debug Utilities
```bash
cd tests/api-tests
node check_available_models.js
```

## 📝 Notes

- These files were moved from the root directory to organize the project structure
- Database files are temporary and can be safely deleted
- Test files use environment variables for API keys
- Some files contain hardcoded test keys for development purposes

## ⚠️ Important

- **Do not commit API keys** - These files may contain test keys
- Database files are **temporary** and should not be committed
- Test files are for **development only** and should not be used in production

## 🗑️ Cleanup

To clean up temporary files:
```bash
cd tests/api-tests
rm -f WiredTiger* *.wt mongod.lock
```

## 📊 Test Coverage

- ✅ Gemini API integration
- ✅ OpenAI API integration  
- ✅ Groq API integration
- ✅ Multi-model fallback testing
- ✅ Error handling validation
- ✅ Response time testing
