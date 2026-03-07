const fs = require('fs');
const path = require('path');

const indexCssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(indexCssPath, 'utf8');

const extractions = [
    {
        name: 'MainLayout',
        start: '/* --- App Layout (MainLayout) --- */',
        end: '/* --- Sidebar --- */',
        file: 'src/components/layout/MainLayout.css'
    },
    {
        name: 'Sidebar',
        start: '/* --- Sidebar --- */',
        end: '/* --- Main Content Wrapper --- */',
        file: 'src/components/layout/Sidebar.css'
    },
    {
        name: 'Header',
        start: '/* --- Header --- */',
        end: '/* --- Main Content Area --- */',
        file: 'src/components/layout/Header.css'
    },
    {
        name: 'CreatePost',
        start: '/* --- Custom Post Creation Actions (CreatePost.tsx) --- */',
        end: '/* --- Post Card Styles (Replacing Tailwind) --- */',
        file: 'src/components/post/CreatePost.css'
    },
    {
        name: 'PostCard',
        start: '/* --- Post Card Styles (Replacing Tailwind) --- */',
        end: '/* Custom Modal Overlay */', // Dropdown is inside this block
        file: 'src/components/post/PostCard.css'
    },
    {
        name: 'Modal',
        start: '/* Custom Modal Overlay */',
        end: '.post-content-area', // Be careful here, post-content-area is back to PostCard. Let's adjust this one manually later or use a better end marker.
        file: 'src/components/ui/Modal.css'
    },
    {
        name: 'PollCreator',
        start: '/* --- Poll Creator UI Styles (Replacing Tailwind) --- */',
        end: '/* --- Comment Section Styles (Replacing Tailwind) --- */',
        file: 'src/components/post/PollCreator.css'
    },
    {
        name: 'CommentSection',
        start: '/* --- Comment Section Styles (Replacing Tailwind) --- */',
        end: '/* --- Tiptap Editor / Rich Text Styles (Since Tailwind is missing) --- */',
        file: 'src/components/post/CommentSection.css'
    },
    {
        name: 'RichTextEditor',
        start: '/* --- Tiptap Editor / Rich Text Styles (Since Tailwind is missing) --- */',
        end: '/* Custom Toast System Animations */',
        file: 'src/components/post/RichTextEditor.css'
    },
    {
        name: 'Toast',
        start: '/* Custom Toast System Animations */',
        end: '.rich-text-content p',
        file: 'src/components/ui/Toast.css'
    },
    {
        name: 'UserSuggestion',
        start: '/* User Suggestion Card Styling */',
        end: '/* Select Option Styling - Light/Dark Theme Fix */',
        file: 'src/components/user/UserSuggestion.css'
    }
];

let remainingCss = css;

for (const ext of extractions) {
    const startIndex = remainingCss.indexOf(ext.start);
    if (startIndex === -1) {
        console.error(`Could not find start marker for ${ext.name}: ${ext.start}`);
        continue;
    }

    const endIndex = remainingCss.indexOf(ext.end, startIndex + ext.start.length);
    if (endIndex === -1 && ext.name !== 'UserSuggestion') {
        console.error(`Could not find end marker for ${ext.name}: ${ext.end}`);
        continue;
    }

    const blockEnd = endIndex !== -1 ? endIndex : remainingCss.length;
    const block = remainingCss.substring(startIndex, blockEnd);

    // Save to new file
    const outPath = path.join(__dirname, ext.file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, block.trim() + '\n\n');
    console.log(`Extracted ${ext.name} to ${ext.file}`);

    // Remove from index.css
    remainingCss = remainingCss.substring(0, startIndex) + remainingCss.substring(blockEnd);
}

// Special case for Post Content Area which is intertwined after modal
const postContentStart = remainingCss.indexOf('.post-content-area');
const pollCreatorStart = remainingCss.indexOf('/* --- Poll Creator UI Styles (Replacing Tailwind) --- */');
if (postContentStart !== -1 && pollCreatorStart !== -1) {
    const postContentBlock = remainingCss.substring(postContentStart, pollCreatorStart);
    const pcPath = path.join(__dirname, 'src/components/post/PostCard.css');
    fs.appendFileSync(pcPath, postContentBlock.trim() + '\n\n');
    remainingCss = remainingCss.substring(0, postContentStart) + remainingCss.substring(pollCreatorStart);
    console.log('Appended PostContent to PostCard.css');
}

// Special case for general rich text styles inside the toast area
const richTextStylesStart = remainingCss.indexOf('.rich-text-content p');
const userSuggestionStart = remainingCss.indexOf('/* User Suggestion Card Styling */');
if (richTextStylesStart !== -1 && userSuggestionStart !== -1) {
    const richTextBlock = remainingCss.substring(richTextStylesStart, userSuggestionStart);
    const rtePath = path.join(__dirname, 'src/components/post/RichTextEditor.css');
    fs.appendFileSync(rtePath, richTextBlock.trim() + '\n\n');
    remainingCss = remainingCss.substring(0, richTextStylesStart) + remainingCss.substring(userSuggestionStart);
    console.log('Appended RichText general styles to RichTextEditor.css');
}

// Pages styles
const pagesStart = remainingCss.indexOf('/* --- Pages Specific Styles --- */');
const createPostStart = remainingCss.indexOf('/* --- Custom Post Creation Actions (CreatePost.tsx) --- */');
if (pagesStart !== -1 && createPostStart !== -1) {
    const pagesBlock = remainingCss.substring(pagesStart, createPostStart);

    // We can further split it or just put it in a temporary file to sort out
    fs.writeFileSync(path.join(__dirname, 'src/pages/Pages.css'), pagesBlock.trim() + '\n\n');
    remainingCss = remainingCss.substring(0, pagesStart) + remainingCss.substring(createPostStart);
    console.log('Extracted Pages styles to src/pages/Pages.css');
}

// Write the remaining CSS back to index.css
// Trim multiple empty lines
remainingCss = remainingCss.replace(/\n\s*\n\s*\n/g, '\n\n');
fs.writeFileSync(indexCssPath, remainingCss);
console.log('Updated index.css');
