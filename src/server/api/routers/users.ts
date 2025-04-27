import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { UData } from "@/app/_components/userDataProvider";
import type { PrismaClient } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";

const randomString = (len: number) => {
  const randomVs = new Uint32Array(len);
  crypto.getRandomValues(randomVs);
  return Array.from(randomVs)
    .map((q) => String.fromCharCode((q % 89) + 37))
    .join("");
};
const hash = async (
  text: string,
  nfo: string[] | { salt: string },
): Promise<{ hash: string; salt: string }> => {
  const salt = !Array.isArray(nfo)
    ? nfo.salt
    : nfo.reduce<string>((p, n) => p + n.substring(0, 4), "") +
      randomString(10);
  const tbuff = new TextEncoder().encode(salt + text);
  const cbuff = await crypto.subtle.digest("SHA-256", tbuff);
  const hashArray = Array.from(new Uint8Array(cbuff));
  const hash = hashArray
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return { hash, salt };
};

export const checkLogin = async (
  db: PrismaClient<
    {
      log: ("query" | "warn" | "error")[];
    },
    never,
    DefaultArgs
  >,
  token: string,
) => {
  const session = await db.session.findFirst({ where: { token } });
  return !!session &&
    session.date.getTime() + session.maxAge * 1000 > Date.now()
    ? session.userId
    : null;
};

export const userRouter = createTRPCRouter({
  // create: publicProcedure
  //   .input(z.object({ name: z.string().min(1) }))
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.db.post.create({
  //       data: {
  //         name: input.name,
  //       },
  //     });
  //   }),
  registerUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        password: z.string().min(8),
        email: z.string().email(),
        session: z.string().or(z.undefined()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, password, session } = input;

      const userExists = await ctx.db.user.findFirst({ where: { email } });

      if (userExists) throw new Error("Użytkownik o takim mailu istnieje!");

      const passToSave = await hash(password, [email, name]);
      const ret = await ctx.db.user.create({
        data: {
          email,
          nick: name,
          password: passToSave.hash,
          salt: passToSave.salt,
        },
      });

      if (ret) {
        return { email: ret.email, nick: ret.nick };
      } else {
        throw new Error("Could not create a new user!");
      }
    }),

  logged: publicProcedure
    .input(z.string().length(64).or(z.null()))
    .query(async ({ ctx, input }) => {
      if (input === null) return { err: "No token provided" };
      const session = await ctx.db.session.findFirst({
        select: { maxAge: !0, date: !0, user: true },
        where: { token: input },
      });
      if (!session) {
        return { err: "Not logged in!" };
      }

      if (session.date.getTime() + session.maxAge * 1000 < Date.now()) {
        return { err: "Session expired!" };
      }
      return {
        mail: session.user.email,
        nick: session.user.nick,
        userid: session.user.id,
      } as UData;
    }),

  logout: publicProcedure
    .input(z.string().or(z.null()))
    .mutation(async ({ ctx, input }) => {
      if (!input) return false;
      await ctx.db.session.delete({ where: { token: input } });
      return true;
    }),

  findUser: publicProcedure
    .input(
      z.object({
        nick: z.string().optional(),
        email: z.string().email().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findFirst({
        select: { id: true },
        where: {
          OR: [
            { nick: { equals: input.nick }, email: { equals: input.email } },
          ],
        },
      });
    }),

  loginUser: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;
      const user = await ctx.db.user.findFirst({
        select: {
          email: true,
          id: true,
          nick: true,
          password: true,
          salt: true,
        },
        where: {
          email,
        },
      });

      if (!user) return { err: "Użytkownik nie istnieje!" };

      const hashed = await hash(password, user);

      if (hashed.hash === user.password) {
        const sessionToken = randomString(64);
        await ctx.db.session.create({
          data: {
            token: sessionToken,
            user: { connect: user },
          },
        });
        return {
          mail: email,
          nick: user.nick,
          userid: user.id,
          session: sessionToken,
        };
      } else {
        return { err: "Złe hasło!" };
      }
    }),
});
