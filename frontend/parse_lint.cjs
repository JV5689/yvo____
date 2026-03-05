const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));

data.forEach(file => {
    if (file.errorCount > 0 || file.warningCount > 0) {
        console.log(`\n=== ${file.filePath} ===`);
        file.messages.forEach(msg => {
            console.log(`Line ${msg.line}: ${msg.message} [${msg.ruleId}]`);
        });
    }
});
