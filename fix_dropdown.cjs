const fs = require('fs');
let content = fs.readFileSync('src/components/DocGenerator.tsx', 'utf8');

const target = `  const renderEnglishOptions = (topics: any[], baseLabel: string) => {
    return topics.map((t, tIdx) => {
      const termLabel = t.term ? \` [\${t.term}]\` : '';
      return (
        <option key={\`\${baseLabel}-\${t.title}-\${tIdx}\`} value={\`\${t.title}|\${t.term || 'General'}\`}>
          {stripPageNumbers(t.title)}{termLabel}
        </option>
      );
    });
  };`;

const replacement = `  const renderEnglishOptions = (topics: any[], baseLabel: string) => {
    if (!topics || topics.length === 0) return null;
    const options = topics.map((t, tIdx) => (
      <option key={\`\${baseLabel}-\${t.title}-\${tIdx}\`} value={\`\${t.title}|\${t.term || 'General'}\`}>
        {stripPageNumbers(t.title)}
      </option>
    ));
    return [
      <option key={\`header-\${baseLabel}\`} disabled className="font-extrabold text-slate-400 bg-slate-100 text-[10px] uppercase tracking-widest">
        --- {baseLabel} ---
      </option>,
      ...options
    ];
  };`;

if (content.includes(target)) {
  fs.writeFileSync('src/components/DocGenerator.tsx', content.replace(target, replacement));
  console.log("Dropdown patched!");
} else {
  console.log("Target not found");
}
