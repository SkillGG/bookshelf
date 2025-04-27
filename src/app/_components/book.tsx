import { api } from "@/trpc/react";

export type BookData = {
  name: string;
  author: string;
  ISBN?: string | null;
  id: number;
  picture?: string | null;
};

export const Book = ({
  book,
  lendable,
}: {
  book: BookData;
  lendable: boolean;
}) => {
  const ownerStatus = api.books.getBookStatus.useQuery({ id: book.id });

  return (
    <div className="border-2 px-2 even:bg-gray-300">
      <div>{book.name}</div>
      <div className="px-2 text-xs">{book.author}</div>
    </div>
  );
};
