/**
 * Generates a 2-letter company code from the company name.
 * "Dayflow Technologies" → "DT"
 * "Odoo India"          → "OI"
 * "Acme"                → "AC"
 */
function generateCompanyCode(companyName) {
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return companyName.substring(0, 2).toUpperCase();
}

/**
 * Generates a unique Login ID.
 * Format: [CompanyCode][First2OfFirstName][First2OfLastName][Year][Serial padded to 4]
 * Example: OIJODO20220001
 */
function generateLoginId(companyCode, empName, year, serial) {
  const parts = empName.trim().split(/\s+/);
  const firstName = (parts[0] || '').substring(0, 2).toUpperCase();
  const lastName  = (parts[1] || parts[0] || '').substring(0, 2).toUpperCase();
  const nameCode  = firstName + lastName;
  return `${companyCode}${nameCode}${year}${String(serial).padStart(4, '0')}`;
}

/**
 * Generates a random temporary password.
 * Example: "Welcome@AB3K"
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Welcome@${suffix}`;
}

module.exports = { generateCompanyCode, generateLoginId, generateTempPassword };
