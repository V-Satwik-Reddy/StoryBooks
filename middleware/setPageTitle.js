const User = require('../store/User'); // Adjust path if needed

module.exports = async (req, res, next) => {
    res.locals.pageTitle = 'StoryBooks'; // Default title
    console.log(`Current Route: ${req.originalUrl}`);

    if (req.originalUrl === '/stories') {
        res.locals.pageTitle = 'Public Stories';
    } else if (req.originalUrl.startsWith('/stories/user/')) {
        const userId = req.params.id || req.originalUrl.split('/').pop();
        console.log(`Extracted User ID: ${userId}`);

        try {
            const user = await User.findById(userId);
            res.locals.pageTitle = user ? `More from ${user.displayName}` : 'User Stories';
        } catch (err) {
            console.error('Error fetching user:', err);
            res.locals.pageTitle = 'User Stories';
        }
    } else if (req.originalUrl.startsWith('/stories/edit/')) {
        res.locals.pageTitle = 'Edit Story';
    } else if (req.originalUrl.startsWith('/stories/add')) {
        res.locals.pageTitle = 'Add New Story';
    } else if (req.originalUrl.startsWith('/dashboard')) {
        res.locals.pageTitle = 'Your Dashboard';
    } else if (req.originalUrl.startsWith('/login')) {
        res.locals.pageTitle = 'Login';
    } else if (req.originalUrl.startsWith('/signup')) {
        res.locals.pageTitle = 'Sign Up';
    } else if (req.originalUrl.startsWith('/stories/') && req.originalUrl.length > 9) {
        res.locals.pageTitle = 'Story Details';
    }

    console.log(`Final Page Title: ${res.locals.pageTitle}`);
    next();
};
