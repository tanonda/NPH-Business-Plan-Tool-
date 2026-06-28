export type PasswordPolicyResult = {
  ok: boolean;
  issues: string[];
};

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const issues: string[] = [];

  if (password.length < 10) issues.push('Password must be at least 10 characters.');
  if (!/[a-z]/.test(password)) issues.push('Password must include a lowercase letter.');
  if (!/[A-Z]/.test(password)) issues.push('Password must include an uppercase letter.');
  if (!/[0-9]/.test(password)) issues.push('Password must include a number.');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Password must include a symbol.');

  const common = ['password', 'admin123', 'businessplan', 'vanuatu', 'changeme'];
  if (common.some((word) => password.toLowerCase().includes(word))) {
    issues.push('Password must not contain common words such as password, admin, businessplan, or changeme.');
  }

  return { ok: issues.length === 0, issues };
}

export function passwordPolicyMessage() {
  return 'Use at least 10 characters with uppercase, lowercase, number, and symbol.';
}
