/**
 * Email validator utility for company email verification
 */

// List of free email providers that are NOT allowed
const FREE_EMAIL_PROVIDERS = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'zoho.com',
    'yandex.com',
    'gmx.com',
    'inbox.com',
    'mail.ru'
];

/**
 * Extract domain from email address
 */
function extractDomain(email) {
    const parts = email.toLowerCase().split('@');
    return parts.length === 2 ? parts[1] : null;
}

/**
 * Extract company name from domain
 * e.g., "google.com" -> "Google"
 */
function extractCompanyName(domain) {
    if (!domain) return null;

    // Remove common TLDs and get the main part
    const parts = domain.split('.');
    if (parts.length >= 2) {
        // Get the second-to-last part (company name)
        const companyPart = parts[parts.length - 2];
        // Capitalize first letter
        return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
    }

    return null;
}

/**
 * Validate if email is a company email (not a free provider)
 */
function isCompanyEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Invalid email format' };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    const domain = extractDomain(email);
    if (!domain) {
        return { valid: false, error: 'Could not extract domain from email' };
    }

    // Check if it's a free email provider
    if (FREE_EMAIL_PROVIDERS.includes(domain)) {
        return {
            valid: false,
            error: `Please use your company email. ${domain} is not allowed.`
        };
    }

    // Additional validation: domain should have at least 2 parts
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
        return { valid: false, error: 'Invalid domain format' };
    }

    return {
        valid: true,
        domain,
        companyName: extractCompanyName(domain)
    };
}

/**
 * Check if two emails are from the same company domain
 */
function isSameDomain(email1, email2) {
    const domain1 = extractDomain(email1);
    const domain2 = extractDomain(email2);
    return domain1 && domain2 && domain1 === domain2;
}

module.exports = {
    isCompanyEmail,
    extractDomain,
    extractCompanyName,
    isSameDomain,
    FREE_EMAIL_PROVIDERS
};
