import { useCallback, useEffect, useState } from "react";
import Quill from "quill"; //import quil from quil library
import "quill/dist/quill.snow.css"; //Quill text editor css
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const INTERVAL = 2000; // Interval for saving document changes

// Feature options for editor
const OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  // Used useEffect hook to setting socket connect with BE application
  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);
    //This is used to disconnect websocket connection when component will unmount
    return () => {
      s.disconnect();
    };
  }, []);

  // This is used for setting up documents contents & enable quill
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // This is used for saving document content after 2 seconds. Also when we are unmounting clearInterval used from clearing up interval responsible for setting up document
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // This hook is used for receiving saved/changed data back to the client. At unmount stage we are switching off the socket
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  //This hook is used for emitting change event events. At unmount stage we are switching off text changes by quill editor
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // wrapperRef basically used for setting up initial context of quill editor
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    // setting up blank html in wrapper
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    //initializing new quil editor
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: OPTIONS },
    });
    q.disable();
    q.setText("Loading..."); // Set the initial loading content
    setQuill(q);
  }, []);
  return <div className="container" ref={wrapperRef}></div>;
}
