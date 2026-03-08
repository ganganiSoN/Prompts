const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const classMappings = {
    '\\bflex\\b': 'd-flex',
    '\\bitems-center\\b': 'align-items-center',
    '\\bitems-start\\b': 'align-items-start',
    '\\bitems-end\\b': 'align-items-end',
    '\\bjustify-between\\b': 'justify-content-between',
    '\\bjustify-center\\b': 'justify-content-center',
    '\\bflex-col\\b': 'flex-column',
    '\\btext-center\\b': 'text-center',
    '\\bfont-bold\\b': 'fw-bold',
    '\\bfont-semibold\\b': 'fw-semibold',
    '\\bw-full\\b': 'w-100',
    '\\bh-full\\b': 'h-100',
    '\\btext-sm\\b': 'small',
    '\\brounded-lg\\b': 'rounded-3',
    '\\brounded-full\\b': 'rounded-circle',
    '\\bshadow-md\\b': 'shadow-sm',
    '\\bshadow-lg\\b': 'shadow'
};

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = walkSync(dirFile, filelist);
        } catch (err) {
            if (err.code === 'ENOTDIR' || err.code === 'EBADF') {
                if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
                    filelist.push(dirFile);
                }
            }
        }
    });
    return filelist;
};

const files = [];
const getFiles = (dir) => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
}

getFiles(directoryPath);

let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (const [tailwind, bootstrap] of Object.entries(classMappings)) {
        const regex = new RegExp(tailwind, 'g');
        content = content.replace(regex, bootstrap);
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        totalReplaced++;
    }
});

console.log(`Replaced classes in ${totalReplaced} files.`);
