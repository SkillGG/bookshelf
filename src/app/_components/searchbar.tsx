import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { Book } from "./book";

type Result = {
  text: string;
  id: number;
};

export const Searchbar = () => {
  const [search, setSearch] = useState("");

  const searchQuery = api.books.search.useQuery(search, {
    enabled: search.length > 2,
  });

  useEffect(() => {
    if (search.length <= 2) return;
    // fecth search
  }, [search]);

  console.log(searchQuery.data);

  return (
    <>
      <div className="relative">
        Szukaj:
        <div className="inline-block">
          <input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <div
            className="absolute flex min-w-[50%] flex-col border-2 bg-white"
            style={{ display: search.length <= 2 ? "none" : "block" }}
          >
            {searchQuery.isFetched &&
              searchQuery.data?.map((book) => {
                return <Book key={book.id} book={book} lendable={false} />;
              })}
          </div>
        </div>
      </div>
    </>
  );
};
