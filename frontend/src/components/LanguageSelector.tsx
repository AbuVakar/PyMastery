import React from 'react';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  languages: string[];
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  currentLanguage, 
  onLanguageChange, 
  languages 
}) => {
  return (
    <div className="language-selector">
      <select 
        value={currentLanguage} 
        onChange={(e) => onLanguageChange(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
