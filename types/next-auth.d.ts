import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      hostProfileId?: string | null;
    };
  }

  interface User {
    id: string;
    passwordHash?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    hostProfileId?: string | null;
  }
}
