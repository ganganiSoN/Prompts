const mongoose = require('mongoose');
const Post = require('./src/models/Post');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const updatePosts = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB. Starting ultra-fast bulk update...');

        const loremStyles = [
            '<p>Lorem ipsum dolor sit amet, <strong>consectetur adipiscing elit</strong>. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. <em>Excepteur sint occaecat cupidatat non proident</em>, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
            '<p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.</p><p>Integer in mauris eu nibh euismod gravida. <strong>Duis ac tellus et risus vulputate vehicula.</strong> Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, <em>eros est euismod turpis</em>, id tincidunt sapien risus a quam.</p>',
            '<p>Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. <strong>Aliquam faucibus, elit ut dictum aliquet</strong>, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat.</p><p>Cras mollis scelerisque nunc. <em>Nullam arcu.</em> Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>'
        ];

        const lorem = loremStyles[2];
        const content = `<h2>Just thinking about technology today!</h2> <p>It really feels like <strong>AI</strong> is taking over! 🚀</p> ${lorem}`;
        
        console.log('Executing updateMany...');
        const result = await Post.updateMany({}, {
            $set: {
                content: content,
                type: 'text'
            }
        });

        console.log(`Successfully updated ${result.modifiedCount} posts out of ${result.matchedCount} found!`);
        process.exit(0);
    } catch (e) {
        console.error('Update failed:', e);
        process.exit(1);
    }
};

updatePosts();
