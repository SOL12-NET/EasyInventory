export function cleanString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics/accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keep only alphanumeric
}

export function generateLogin(fullName: string, existingLogins: string[]): string {
  const parts = fullName.trim().split(/[\s-]+/);
  
  if (parts.length === 0 || !parts[0]) {
    return "user";
  }

  const firstName = cleanString(parts[0]);
  const lastName = cleanString(parts.slice(1).join(""));

  if (!lastName) {
    // If no last name, fall back to first name
    let login = firstName;
    let counter = 2;
    while (existingLogins.includes(login)) {
      login = `${firstName}${counter}`;
      counter++;
    }
    return login;
  }

  // Attempt 1: First letter of first name + last name
  let attemptLength = 1;
  while (attemptLength <= firstName.length) {
    const login = firstName.substring(0, attemptLength) + lastName;
    if (!existingLogins.includes(login)) {
      return login;
    }
    attemptLength++;
  }

  // If all lengths of first name collide, append numbers (e.g. jdupont2, jdupont3)
  const baseLogin = firstName.charAt(0) + lastName;
  let counter = 2;
  while (true) {
    const login = `${baseLogin}${counter}`;
    if (!existingLogins.includes(login)) {
      return login;
    }
    counter++;
  }
}

export function generateRandomPassword(): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 8;
  let password = "";
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto) {
      const bytes = new Uint8Array(length);
      globalThis.crypto.getRandomValues(bytes);
      for (let i = 0; i < length; i++) {
        password += charset[bytes[i] % charset.length];
      }
      return password;
    }
  } catch (e) {
    // fallback
  }

  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}
