export const jwtConstants = {
  secret: process.env.JWT_SECRET,
};

export function resetTokenSecret(passwordHash: string): string {
  return `${jwtConstants.secret}${passwordHash}`;
}
