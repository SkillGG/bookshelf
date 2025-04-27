import { api } from "@/trpc/react";
import { Loading } from "./loading";
import { useRef, useState } from "react";
import { Book } from "./book";
import { getUData } from "./userDataProvider";

/**
 *
 * @param {HTMLDialogElement} dialog
 * @param {()=>void} [closeCallback]
 */
const makeDialogBackdropExitable = (
  dialog: HTMLDialogElement,
  closeCallback: () => void,
) => {
  dialog.addEventListener("click", function (event) {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      dialog.close();
      closeCallback?.();
    }
  });
};

export const Bookshelf = ({
  userid,
  editable,
  title,
  token,
}: {
  userid: string;
  editable?: undefined | true;
  title?: string;
  token: string;
}) => {
  const userdata = api.books.getUserInfo.useQuery(userid);

  const uploadBook = api.books.addBook.useMutation();
  const user = api.users.logged.useQuery(token);

  const forceEditable =
    user.data && !("err" in user.data) && user.data.userid === userid;

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const edit = forceEditable || editable;

  const dialogRef = useRef<HTMLDialogElement>(null);

  const utils = api.useUtils();

  const [author, setAuthor] = useState("");
  const [ISBN, setISBN] = useState("");
  const [name, setName] = useState("");
  const [picture, setPicture] = useState("");

  if (userdata.isLoading) {
    return <Loading />;
  }
  if (!userdata.data) {
    return <></>;
  }

  if ("err" in userdata.data) {
    return <>{userdata.data.err}</>;
  }

  const { data: u } = userdata;

  // console.log(u);

  return (
    <div className="col-span-2">
      <div>{title ?? `Książki użytkownika ${u.nick}`}</div>
      <div>
        {u.books.map((book) => {
          return <Book key={book.id} book={book} lendable={!edit} />;
        })}
        {edit && (
          <div>
            <button
              className="w-full cursor-pointer border-1"
              onClick={() => {
                if (dialogRef.current) {
                  makeDialogBackdropExitable(dialogRef.current, () => void 0);
                  dialogRef.current.showModal();
                }
              }}
            >
              Dodaj
            </button>
            <dialog ref={dialogRef} className="mx-auto my-auto">
              <div className="h-full w-full border-1 bg-white p-2">
                <div className="mx-auto w-fit">Dodawanie książki</div>
                <div>
                  <div className="mb-2">
                    Nazwa<sup className="text-red-500">*</sup>:{" "}
                    <input
                      value={name}
                      onChange={(e) => setName(e.currentTarget.value)}
                      className="border-b-2"
                    />
                  </div>
                  <div className="mb-2">
                    Autor<sup className="text-red-500">*</sup>:{" "}
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.currentTarget.value)}
                      className="border-b-2"
                    />
                  </div>
                  <div className="mb-2">
                    ISBN:{" "}
                    <input
                      value={ISBN}
                      onChange={(e) => setISBN(e.currentTarget.value)}
                      className="border-b-2"
                    />
                  </div>
                  <div className="mb-2">
                    Zdjęcie:{" "}
                    <label className="cursor-pointer">
                      Załaduj
                      <input className="hidden" type="file" />
                    </label>
                  </div>
                </div>
                <button
                  className="mx-auto block border-2 px-2 py-2"
                  onClick={async () => {
                    const bookMutation = await uploadBook.mutateAsync({
                      author,
                      name,
                      isbn: ISBN,
                      picture,
                      token,
                      userid,
                    });
                    await utils.books.getUserInfo.invalidate();
                    dialogRef.current?.close();
                  }}
                >
                  Dodaj
                </button>
              </div>
            </dialog>
          </div>
        )}
      </div>
    </div>
  );
};
