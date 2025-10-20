import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prismaWithRetry } from './prisma-utils'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prismaWithRetry.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        try {
          // Verificar se o usuário já existe
          const existingUser = await prismaWithRetry.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            // Criar novo usuário do Google
            await prismaWithRetry.user.create({
              data: {
                email: user.email,
                name: user.name,
                role: 'USER'
              }
            })
          }
          return true
        } catch (error) {
          console.error('Erro ao criar usuário do Google:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      if (user) {
        // Para usuários do Google, buscar dados do banco
        if (account?.provider === 'google') {
          const dbUser = await prismaWithRetry.user.findUnique({
            where: { email: user.email }
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
          }
        } else {
          token.id = user.id
          token.role = user.role
        }
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id || token.sub
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET
}