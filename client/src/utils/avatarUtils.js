/**
 * Generates a consistent random avatar URL using DiceBear based on a seed.
 * Seeds can be user IDs, interview IDs, or guest IDs.
 */
export const getRandomAvatar = (seed) => {
    if (!seed) return 'https://res.cloudinary.com/dblnstdzw/image/upload/v1768822941/interview-sharing-platform/avatars/default-avatar.png';

    // Using the "bottts" style for a fun, techy look for anonymous users
    // You can also try "identicon", "avataaars", "pixel-art", etc.
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const getAnonymousAvatar = (id) => getRandomAvatar(id || 'anonymous');
