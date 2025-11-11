import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { internal } from './_generated/api';

/**
 * Generate a random access code
 * Format: 8-character alphanumeric (uppercase)
 */
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Bootstrap: Create the first national admin access code
 * This can be called without authentication to set up the initial admin
 * Call this from the Convex dashboard: npx convex run bootstrap:createNationalAdmin --email "your@email.com"
 */
export const createNationalAdmin = mutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    code: v.string(),
    email: v.string(),
    role: v.literal('national_admin'),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if any national admin codes already exist
    const existingNationalAdmin = await ctx.db
      .query('accessCodes')
      .withIndex('by_role', (q) => q.eq('role', 'national_admin'))
      .filter((q) => q.neq(q.field('status'), 'revoked'))
      .first();

    if (existingNationalAdmin) {
      throw new Error(
        'Un code d\'accès administrateur national existe déjà. Utilisez ce code ou révoquez-le d\'abord.'
      );
    }

    // Check if email already has an access code
    const existingCode = await ctx.db
      .query('accessCodes')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .filter((q) => q.neq(q.field('status'), 'revoked'))
      .first();

    if (existingCode) {
      throw new Error(`L'email ${args.email} a déjà un code d'accès actif`);
    }

    // Generate unique code
    let code: string = '';
    let codeExists = true;
    while (codeExists) {
      code = generateAccessCode();
      const existing = await ctx.db
        .query('accessCodes')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first();
      codeExists = !!existing;
    }

    // Create access code
    await ctx.db.insert('accessCodes', {
      code,
      email: args.email.toLowerCase(),
      status: 'pending',
      role: 'national_admin',
      createdAt: Date.now(),
    });

    // Schedule email to be sent
    await ctx.scheduler.runAfter(0, internal.emails.sendAccessCodeEmail, {
      email: args.email.toLowerCase(),
      code,
    });

    return {
      code,
      email: args.email.toLowerCase(),
      role: 'national_admin' as const,
      message: `Code d'accès administrateur national créé ! Utilisez le code : ${code} avec l'email : ${args.email.toLowerCase()} pour vous inscrire.`,
    };
  },
});

