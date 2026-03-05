const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Running eslint...');
    const stdout = execSync('npx eslint src --format json', { stdio: 'pipe' });
    fs.writeFileSync('lint_report.json', stdout);
    console.log('Lint report generated (no errors).');
} catch (error) {
    // eslint returns exit code 1 if there are errors, which throws here.
    // The output is in error.stdout
    fs.writeFileSync('lint_report.json', error.stdout);
    console.log('Lint report generated (with errors).');
}
