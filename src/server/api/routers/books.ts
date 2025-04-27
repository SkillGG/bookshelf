import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { checkLogin } from "./users";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/server/db";

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

export const bookRouter = createTRPCRouter({
  // create: publicProcedure
  //   .input(z.object({ name: z.string().min(1) }))
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.db.post.create({
  //       data: {
  //         name: input.name,
  //       },
  //     });
  //   }),
  getUserInfo: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        select: { books: true, borrows: true, lents: true, nick: true },
        where: { id: input },
      });

      if (!user) {
        return { err: "Taki użytkownik nie istnieje!" };
      }

      return user;
    }),
  search: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const books = await ctx.db.book.findMany({
      select: { name: true, author: true, ISBN: true, id: true },
      where: {
        OR: [
          { author: { contains: input } },
          { name: { contains: input } },
          { user: { nick: { contains: input } } },
        ],
      },
    });

    return books;
  }),

  getPicturePresign: publicProcedure
    .input(z.object({ token: z.string(), userid: z.string() }))
    .mutation(async ({ ctx: { s3 }, input }) => {
      const randomStr = randomString(10);
      const key = input.userid + randomStr;
      const command = new PutObjectCommand({ Bucket: "cover", Key: key });
      return { url: getSignedUrl(s3, command, { expiresIn: 3600 }), key: key };
    }),

  addBook: publicProcedure
    .input(
      z.object({
        userid: z.string(),
        token: z.string().length(64),
        name: z.string(),
        author: z.string(),
        isbn: z.string().optional(),
        picture: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, author, isbn } = input;

      if (!(await checkLogin(ctx.db, input.token)))
        return { err: "Not logged in!" };

      if (input.picture) {
        // upload the picture to s3
        throw new Error("TODO");
      }

      const book = await ctx.db.book.create({
        data: { author, name, ISBN: "?", userID: input.userid },
      });

      return book;
    }),
  getBookStatus: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const bookinfo = ctx.db.share.findMany({
        include: { book: true, borrower: true, lender: true },
        where: { bookID: input.id },
      });

      console.log(bookinfo);
    }),
  askToLend: publicProcedure
    .input(z.object({ token: z.string(), bookid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await checkLogin(ctx.db, input.token);

      if (!user) return { err: "User not logged on!" };

      const book = await ctx.db.book.findFirst({
        include: { user: { select: { id: true } } },
        where: { id: input.bookid },
      });
      if (!book) return { err: "No book found" };

      const shareRequest = await ctx.db.share.create({
        data: {
          bookID: book.id,
          borrowerID: user,
          lenderID: book.userID,
          date: new Date(),
        },
      });

      console.log(shareRequest);

      return shareRequest;
    }),
});
