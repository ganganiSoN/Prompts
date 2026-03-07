const fs = require('fs');
const path = require('path');

const injections = [
    { p: 'src/components/layout/MainLayout.tsx', css: './MainLayout.css' },
    { p: 'src/components/layout/Sidebar.tsx', css: './Sidebar.css' },
    { p: 'src/components/layout/Header.tsx', css: './Header.css' },
    { p: 'src/components/post/CreatePost.tsx', css: './CreatePost.css' },
    { p: 'src/components/post/CreatePost.tsx', css: './PollCreator.css' },
    { p: 'src/components/post/PostCard.tsx', css: './PostCard.css' },
    { p: 'src/components/post/ReportModal.tsx', css: '../ui/Modal.css' },
    { p: 'src/components/post/CommentSection.tsx', css: './CommentSection.css' },
    { p: 'src/components/post/RichTextEditor.tsx', css: './RichTextEditor.css' },
    { p: 'src/context/ToastContext.tsx', css: '../components/ui/Toast.css' },
    { p: 'src/components/user/UserSuggestion.tsx', css: './UserSuggestion.css' }
];

for (const inj of injections) {
    const fullPath = path.join(__dirname, inj.p);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const importStatement = `import '${inj.css}';\n`;
        if (!content.includes(importStatement)) {
            // Find the last import statement to insert after it
            const lines = content.split('\n');
            let insertIdx = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    insertIdx = i + 1;
                }
            }
            lines.splice(insertIdx, 0, importStatement);
            fs.writeFileSync(fullPath, lines.join('\n'));
            console.log(`Injected ${inj.css} into ${inj.p}`);
        }
    } else {
        console.warn(`File not found: ${fullPath}`);
    }
}
