import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readTab } from '@/lib/sheets';
import bcrypt from 'bcryptjs';

interface TeacherRow {
  id: string; email: string; passwordHash: string; name: string;
  role: string; branch: string; assignedClass: string; assignedSection: string; isActive: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const teachers = await readTab<TeacherRow>('Teachers');
        const match = teachers.find((t) => t.email.toLowerCase() === credentials.email.toLowerCase());
        if (!match || match.isActive === 'false') return null;

        const valid = await bcrypt.compare(credentials.password, match.passwordHash || '');
        if (!valid) return null;

        return {
          id: match.id,
          email: match.email,
          name: match.name,
          // extra fields carried through jwt callback below
          role: match.role,
          branch: match.branch,
          assignedClass: match.assignedClass,
          assignedSection: match.assignedSection,
        } as any;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.branch = (user as any).branch;
        token.assignedClass = (user as any).assignedClass;
        token.assignedSection = (user as any).assignedSection;
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
