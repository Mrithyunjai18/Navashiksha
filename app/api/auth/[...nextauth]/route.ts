import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { readTab } from '@/lib/sheets';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Only allow sign-in for emails present in the Teachers tab.
    async signIn({ user }) {
      if (!user.email) return false;
      const teachers = await readTab<{ googleEmail: string; isActive: string }>('Teachers');
      const match = teachers.find((t) => t.googleEmail.toLowerCase() === user.email!.toLowerCase());
      return !!match && match.isActive !== 'false';
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const teachers = await readTab<{ googleEmail: string; role: string; name: string; branch: string; assignedClass: string; assignedSection: string }>('Teachers');
        const match = teachers.find((t) => t.googleEmail.toLowerCase() === user.email!.toLowerCase());
        if (match) {
          token.role = match.role; // "ADMIN" | "TEACHER"
          token.name = match.name;
          token.branch = match.branch;
          token.assignedClass = match.assignedClass;
          token.assignedSection = match.assignedSection;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
      (session.user as any).branch = token.branch;
      (session.user as any).assignedClass = token.assignedClass;
      (session.user as any).assignedSection = token.assignedSection;
      return session;
    },
  },
  pages: { signIn: '/login' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
