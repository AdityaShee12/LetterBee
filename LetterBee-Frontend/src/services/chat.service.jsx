import { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import socket from "../sockets/socket.js";
import { AiOutlinePhone, AiOutlineVideoCamera } from "react-icons/ai";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import { FiCopy, FiTrash2, FiStar } from "react-icons/fi";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { IoArrowBack } from "react-icons/io5"; // or FaArrowLeft, MdArrowBack etc.
import { useSelector } from "react-redux";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const ChatService = () => {
  const [receiverId, setReceiverId] = useState("");
  const [receiverAvatar, setReceiverAvatar] = useState("");
  const [receiverFullName, setReceiverFullName] = useState("");
  const [receiverAbout, setReceiverAbout] = useState("");
  const [state, setState] = useState("offline");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const secretKey = "0123456789abcdef0123456789abcdef";
  const iv = "abcdef9876543210abcdef9876543210";
  const chatContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const [deleteMessage, setDeleteMessage] = useState();
  const [identifier, setIdentifier] = useState("");
  const [delFunc, setDelFunc] = useState(false);
  const [everyone, setEveryone] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const contextRef = useRef(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const [receivedFile, setReceivedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    message: "",
  });
  const [isVideo, setIsVideo] = useState(false);
  let offset = { x: 0, y: 0 };
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [localVideoPos, setLocalVideoPos] = useState({ x: 20, y: 20 });
  const dragRef = useRef(null);
  const [isSwapped, setIsSwapped] = useState(false);
  let pressTimer = null;
  const [profileDetails, setproFileDetails] = useState(false);
  const profileRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState();
  const [activeSection, setActiveSection] = useState("profile");
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomcontext = useRef(null);
  const [menuAnimation, setMenuAnimation] = useState(false);
  const [relationStatus, setRelationStatus] = useState("");
  const [participantType, setParticipantType] = useState("sender");
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [requestSender, setRequestSender] = useState("sender");

  const [senderId, setSenderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [senderAvatar, setSenderAvatar] = useState("");
  const [email, setEmail] = useState();
  const [userName, setUserName] = useState();
  const [about, setAbout] = useState();
  const [receiverUsername, setReceiverUserName] = useState();
  const [receiverEmail, setReceiverEmail] = useState();

  const { user } = useSelector(
    (state) => state.user,
  );

  const { selectUser } = useSelector(
    (state) => state.user,
  );

  // Destructure id, email, userName and assign those data on useState variable
  useEffect(() => {
    const { _id, email, fullName, userName, avatar, about } = user;
    setSenderId(_id);
    setSenderAvatar(avatar);
    setFullName(fullName);
    setEmail(email);
    setUserName(userName);
    setAbout(about);
  }, [user]);

  // Destructure id, email, userName and assign those data on useState variable
  useEffect(() => {
    const { _id, email, fullName, userName, avatar, about } = selectUser;
    setReceiverId(_id);
    setReceiverFullName(fullName);
    setReceiverUserName(userName);
    setReceiverEmail(email);
    setReceiverAbout(about);
    setReceiverAvatar(avatar);
  }, [selectUser]);

  // useEffect for select user, onloine-offline, disconnection, previous sms,
  useEffect(() => {

    // Select other user from search list
    const recieverFunction = async () => {
      try {
        socket.emit("reciever add", {
          senderId,
          receiverId,
        });
      } catch (error) {
        console.log("RA Err", error);
      }
    };

    recieverFunction();

    // Handling state online or offline of other user
    socket.on("state", (state) => {
      console.log("State", state);

      if (state) {
        setState("online");
      } else {
        setState("offline");
      }
    }
    );

    // Handling disconnection of client
    socket.on("checkDisconnect", (state) => {
      setState(state);
      setTimeout(() => {
        socket.emit("check after reload", { senderId, receiverId });
      }, 2000);
    });

    // Handling receive message
    socket.on("receive message", (data) => {

      const { identifier, fileName, fileType, buf, sms } = data;
      // let message =
      //   typeof sms === "string" && !sms.startsWith("http")
      //     ? decryptMessage(sms)
      //     : sms;
      let message = sms;
      let uint8Array;
      let blob;
      let fileURL;

      if (buf) {
        // Convert ArrayBuffer to Uint8Array before creating blob
        uint8Array = new Uint8Array(buf);
        blob = new Blob([uint8Array], { type: fileType });
        fileURL = URL.createObjectURL(blob);
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: "Sender",
          identifier,
          message,
          fileName,
          fileType,
          fileURL,
        },
      ]);
    });

    // Show previous message
    socket.on("receive groupMessage", (data) => {
      const { senderId, identifier, fileName, fileType, fileData, sms } = data;

      // message decrypt
      // const message =
      //   typeof sms === "string" && !sms.startsWith("http")
      //     ? decryptMessage(sms)
      //     : sms;
      const message = sms;

      if (file?.fileData && file?.fileType) {
        fileURL = `data:${file.fileType};base64,${file.fileData}`;
        fileName = file.fileName || null;
        fileType = file.fileType || null;
      }
      let id, avatar, name;
      if (senderId === senderId) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "You",
            identifier,
            message,
            fileName,
            fileType,
            fileURL,
          },
        ]);
      } else {
        for (const member of groupMembers) {
          if (senderId === member.id) {
            id = member.id;
            avatar = member.avatar;
            name = member.name;
          }
        }
        setMessages((prev) => [
          ...prev,
          {
            id,
            avatar,
            name,
            identifier,
            message,
            fileName,
            fileType,
            fileURL,
          },
        ]);
      }
    });

    socket.on("requestSender", (data) => {
      if (data) {
        setRequestSender("receiver");
      }
    }
    );

    socket.on("storedSms", (data) => {

      const {
        sender,
        identifier,
        file,
        text
      } = data;

      // -------------------------
      // TEXT MESSAGE
      // -------------------------

      let message = text;

      if (
        typeof text === "string" &&
        !text.startsWith("http")
      ) {
        // message = decryptMessage(text);
        message = text;
      }


      // -------------------------
      // FILE
      // -------------------------

      let fileURL = null;
      let fileName = null;
      let fileType = null;

      if (
        file &&
        file.fileData &&
        file.fileType
      ) {

        fileURL =
          `data:${file.fileType};base64,${file.fileData}`;

        fileName = file.fileName || null;
        fileType = file.fileType || null;
      }

      // -------------------------
      // SENDER CHECK
      // -------------------------

      const messageSender =
        sender?.id === senderId
          ? "You"
          : "Receiver";

      // -------------------------
      // STORE IN FRONTEND
      // -------------------------

      setMessages((prev) => [
        ...prev,
        {
          sender: messageSender,

          identifier,

          message,

          fileName,

          fileType,

          fileURL
        }
      ]);
    });

    return () => {
      socket.off("state");
      socket.off("checkDisconnect");
      socket.off("receive message");
      socket.off("storedSms");
    };
  }, [senderId, receiverId, receiverFullName]);

  // StartDrag
  const startDrag = (e) => {
    e.preventDefault();
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    offset = {
      x: clientX - localVideoPos.x,
      y: clientY - localVideoPos.y,
    };

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag);
    document.addEventListener("touchend", stopDrag);
  };

  const onDrag = (e) => {
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    setLocalVideoPos({
      x: clientX - offset.x,
      y: clientY - offset.y,
    });
  };

  const stopDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    };
  };

  const handleMouseUp = () => {
    clearTimeout(pressTimer);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // useEffect(() => {
  //   socket.on("requestSender", (data) => {
  //     if (data.data === "receiver") {
  //       setRequestSender("receiver");
  //     }
  //   });
  //   return () => {
  //     socket.off("requestSender");
  //   };
  // }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const previewURL = URL.createObjectURL(selectedFile);
      setFilePreview(previewURL);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    // socket.emit("typing-state", ToId);
    const textarea = messageInputRef.current;
    textarea.style.height = "auto"; // Height reset
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"; // Max height 200px
  };

  // Decruption of sms
  function decryptMessage(encryptedText) {
    if (encryptMessage) {
      const bytes = CryptoJS.AES.decrypt(
        encryptedText,
        CryptoJS.enc.Hex.parse(secretKey),
        {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      return bytes.toString(CryptoJS.enc.Utf8);
    }
  }

  // Encryption of sms
  function encryptMessage(message) {
    if (message) {
      return CryptoJS.AES.encrypt(message, CryptoJS.enc.Hex.parse(secretKey), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString();
    }
  }

  // Managing Contextmenu 
  const openContextMenu = (msg, event) => {
    event.preventDefault();
    const message = msg.message,
      identifier = msg.identifier,
      isOwnMessage = msg.sender === "You",
      delIdentifier = msg.delIdentifier;
    const rect = event.target.getBoundingClientRect();

    let positionX = isOwnMessage ? rect.left - 180 : rect.right + 10;
    let positionY = rect.top + window.scrollY;

    const menuHeight = 150; // Approx height of the context menu
    const viewportHeight = window.innerHeight;

    if (rect.top + menuHeight > viewportHeight) {
      // Position upwards if it overflows
      positionY = rect.bottom + window.scrollY - menuHeight;
    }

    if (delIdentifier) {
      setDelFunc(true);
    } else {
      setContextMenu({
        show: true,
        x: positionX,
        y: positionY,
        message: "",
      });
      setDeleteMessage(message);
      document.body.style.overflow = "hidden";
    }
    setIdentifier(identifier);
  };

  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      message,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };

    if (contextMenu.show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.show]);

  // Delete sms
  const Delete = (sender) => {
    console.log(identifier);
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.identifier === identifier) {
          if (sender === "You") {
            console.log("delete everyone");
            socket.emit("delete-everyone", { OwnId, ToId, identifier });
            return {
              ...msg,
              identifier,
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          } else if (sender === "Me") {
            console.log("delete me");

            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "You",
            });
            return {
              ...msg,
              identifier,
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          } else if (sender === "Me1") {
            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "me",
            });
            return {
              ...msg,
              identifier: "",
              delIdentifier: "D",
              name: "",
              message: "This message was deleted by you",
            };
          } else {
            socket.emit("delete-me", {
              OwnId,
              ToId,
              identifier,
              sender: "me",
            });
            return {
              ...msg,
              identifier: "",
              delIdentifier: "",
              name: "",
              message: "",
            };
          }
        }
        return msg;
      }),
    );
    setDeleteMessage("");
    closeContextMenu();
    setDelFunc(false);
    if (everyone) setEveryone(false);
  };

  socket.on("delete", (identifier) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.identifier === identifier
          ? {
            ...msg,
            name: "",
            delIdentifier: "D",
            message: "This message was deleted by sender",
          }
          : msg,
      ),
    );
  });

  const deleteFunction = () => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.identifier === identifier) {
          if (msg.sender === "You") {
            setEveryone(true);
          } else {
            setEveryone(false);
          }
        }
        return msg;
      }),
    );
    closeContextMenu();
    setDelFunc(true);
  };

  // Copy sms
  const copyFunction = () => {
    setMessages((prevMessages) => {
      const copiedMessage = prevMessages.find(
        (msg) => msg.identifier === identifier,
      );
      if (copiedMessage) {
        navigator.clipboard
          .writeText(copiedMessage.message || "")
          .then(() => {
            console.log("Message copied successfully!");
          })
          .catch((err) => {
            console.error("Failed to copy message:", err);
          });
      }
      return prevMessages;
    });
    closeContextMenu();
  };

  // Video call system
  const getStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const createPeerConnection = async () => {
    let stream = localStream;
    if (!stream) stream = await getStream();
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate, receiverId);
      } else {
        console.log("Candidate not work");
      }
    };
    peerConnectionRef.current.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log("Succes");
      } else {
        console.log("not success");
      }
    };
    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      console.log("G");
    }
  };

  const createOffer = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", offer, receiverId);
  };

  useEffect(() => {
    socket.on("offer", async (offer) => {
      setIsVideo(true);

      if (!peerConnectionRef.current) {
        await createPeerConnection();
      }
      const pc = peerConnectionRef.current;
      // Remote Description set করা (safe check সহ)
      if (
        pc.signalingState === "stable" ||
        pc.signalingState === "have-local-offer"
      ) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("✅ Remote offer set");
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", answer, receiverId);
      } else {
        console.warn(
          "⚠ Cannot set offer, invalid signaling state:",
          pc.signalingState,
        );
        return;
      }
    });

    const handleAnswer = async (answer) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      console.log("Before setting answer, signalingState:", pc.signalingState);

      if (
        pc.signalingState === "have-local-offer" &&
        pc.remoteDescription === null
      ) {
        try {
          await pc.setRemoteDescription(answer);
          console.log("✅ Remote answer set successfully");
        } catch (err) {
          console.error("❌ Error setting remote answer:", err);
        }
      } else {
        console.warn("⚠ Skipping answer: Already stable or answer set");
      }
    };

    socket.on("ice-candidate", async (candidate) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ ICE candidate added");
        } catch (error) {
          console.error("❌ Error adding ICE candidate:", error);
        }
      }
    });

    socket.on("answer", handleAnswer);
    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  const videoCallSystem = async () => {
    setIsVideo(true);
    await getStream();
    await createPeerConnection();
    await createOffer();
  };

  const closeZoom = () => {
    setIsZoomed(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (zoomcontext.current && !zoomcontext.current.contains(event.target)) {
        closeZoom();
      }
    };
    if (isZoomed) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isZoomed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        closeprofileContext();
      }
    };

    if (profileDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDetails]);

  const openProfileContext = (e) => {
    e.preventDefault();
    setproFileDetails(true);
    setMenuAnimation(false);
    setTimeout(() => setMenuAnimation(true), 300);
  };

  const closeprofileContext = () => {
    setproFileDetails(false);
    setMenuAnimation(false);
  };

  const overview = (e) => {
    e.preventDefault();
    setActiveSection("profile");
  };

  const media = (e) => {
    e.preventDefault();
    setActiveSection("media");
  };

  const files = (e) => {
    e.preventDefault();
    setActiveSection("files");
  };

  const links = (e) => {
    e.preventDefault();
    setActiveSection("links");
  };

  const groups = (e) => {
    e.preventDefault();
    setActiveSection("groups");
  };

  // Sending Message
  const sendMessage = async () => {
    if (!message.trim() && !file) return;
    // const sms = encryptMessage(message);
    let fileBuffer;
    let fileType;
    let fileURL;
    let fileName;
    if (file) {
      fileBuffer = await file.arrayBuffer();
      fileName = file.name;
      fileType = file.type;
      fileURL = URL.createObjectURL(
        new Blob([new Uint8Array(fileBuffer)], { type: fileType }),
      );
    }
    const identifier = uuidv4();
    const sendItem = {
      senderId,
      fullName,
      senderAvatar,
      receiverId,
      receiverFullName,
      receiverAvatar,
      identifier,
      sms: message,
      fileName,
      fileType,
      fileBuffer,
    };
    if (state === "online") {
      socket.emit("send message", sendItem);
      setMessages((prev) => [
        ...prev,
        { sender: "You", identifier, message, fileName, fileType, fileURL },
      ]);
      setFile(null);
      fileInputRef.current.value = "";
      if (message) setMessage("");
    } else {
      socket.emit("offline_User sms", sendItem);
      console.log("offline");
      setMessages((prev) => [
        ...prev,
        { sender: "You", identifier, message, fileName, fileType, fileURL },
      ]);
      setFile(null);
      fileInputRef.current.value = "";
      if (message) setMessage("");
    }
  };

  // Checking friend or not
  useEffect(() => {

    socket.on("relation-status", (data) => {

      const { status, sender } = data;

      setRelationStatus(status);

      if (status === "pending" || status === "accepted" || status === "rejected") {
        setRequestSender(sender);
      }
    });

    return () => {
      socket.off("relation-status");
    };
  }, []);

  const removeRequest = () => {

  }

  // Code for sending requests
  const sendRequest = () => {
    socket.emit("sendRequest", {
      senderId,
      receiverId,
    });
    setRelationStatus("pending");
    setRequestSender(senderId);
  };

  // Code for accept or reject requests
  const replyRequest = (accept) => {

    socket.emit("acceptRequest", {
      senderId,
      receiverId,
      accept: accept ? 1 : 0,
    });
    if (accept) {
      setRelationStatus("accepted");
    }
  };

  return (
    <div className="flex flex-col items-center justify-between mt-[0.7rem] pl-[0.9rem] pr-[0.9rem] bg-[#f0f1f8] min-h-screen w-full relative z-10">

      {/* ─── Header / Profile bar ─── */}
      <div
        className="flex justify-between items-center w-full rounded-xl h-[4.5rem] cursor-pointer
             bg-white border border-[#d6d8ef] px-3 sticky top-0 z-30"
        onClick={(e) => openProfileContext(e)}
      >
        {/* Avatar + Name + Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={receiverAvatar}
              alt=""
              className="w-11 h-11 rounded-full object-cover border border-[#d6d8ef]"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#f0f1f8]
          ${state === "Online" ? "bg-emerald-400" : "bg-[#d6d8ef]"}`}
            />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="text-[0.95rem] font-semibold leading-tight text-[#1a1a2e]">
              {receiverFullName}
            </h2>
            <p className={`text-xs flex items-center gap-1 font-medium
        ${state === "Online" ? "text-emerald-500" : "text-[#9090a8]"}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full
          ${state === "Online" ? "bg-emerald-500" : "bg-[#9090a8]"}`} />
              {state === "Online" ? "Online" : `${state}`}
            </p>
          </div>
        </div>

        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl
               bg-[#eef0fb] border border-[#d6d8ef] text-[#3D4DB7]
               hover:bg-[#3D4DB7] hover:text-white hover:border-[#3D4DB7] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            alert("Video call feature will be available within one week");
          }}
        >
          <AiOutlineVideoCamera size={20} />
        </div>
      </div>

      {/* ─── Profile Details Panel ─── */}
      {profileDetails && (
        <div
          ref={profileRef}
          className="absolute z-10 w-[30rem] h-[29rem] shadow-2xl mt-[4rem]
               rounded-2xl overflow-hidden border border-[#d6d8ef]"
        >
          <div className="flex h-full">
            {/* Left sidebar */}
            <div className="flex flex-col pt-4 pl-4 gap-3 bg-[#eef0fb] w-[8rem] border-r border-[#d6d8ef]">
              {[
                { label: "Overview", fn: overview },
                { label: "Media", fn: media },
                { label: "Links", fn: files },
                { label: "Files", fn: links },
                { label: "Groups", fn: groups },
              ].map(({ label, fn }) => (
                <div
                  key={label}
                  onClick={(e) => fn(e)}
                  className="cursor-pointer text-sm text-[#9090a8] hover:text-[#3D4DB7]
                       px-2 py-1 rounded-lg hover:bg-[#d6d8ef] transition-colors"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Right content */}
            <div className="bg-white flex-1 overflow-y-auto">
              {activeSection === "profile" && (
                <div>
                  <div className="flex flex-col items-center p-4 rounded-lg overflow-hidden">
                    {/* Profile Picture */}
                    <div className={`${isZoomed
                      ? "fixed bg-black flex justify-center items-center inset-0 z-50"
                      : "relative w-28 h-28"}`}
                    >
                      <div
                        className={`${isZoomed ? "absolute z-50 left-7 top-7 text-[#1a1a2e]" : "hidden"}`}
                        onClick={() => setIsZoomed(false)}
                      >
                        <IoArrowBack size={24} className="cursor-pointer" />
                      </div>

                      {isZoomed ? (
                        <TransformWrapper initialScale={1} wheel={{ step: 0.1 }} pinch={{ step: 5 }} doubleClick={{ disabled: true }}>
                          <TransformComponent>
                            <img src={receiverAvatar} alt="profile" className="w-[48vw] h-[95vh]" />
                          </TransformComponent>
                        </TransformWrapper>
                      ) : (
                        <img
                          src={receiverAvatar}
                          alt=""
                          onClick={() => setIsZoomed(true)}
                          className="absolute w-28 h-28 rounded-full cursor-pointer
                               ring-2 ring-[#3D4DB7]/30 object-cover"
                        />
                      )}
                    </div>

                    {/* Name + status badge */}
                    <div className="flex items-center gap-2 mt-4">
                      <h2 className="text-xl font-bold text-[#1a1a2e]">{receiverFullName}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${state === "Online"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-[#eef0fb] text-[#9090a8]"}`}>
                        {state === "Online" ? "● Online" : "● Offline"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-4 py-5 w-full">
                      <div
                        className="flex flex-col items-center justify-center gap-1 cursor-pointer
                             bg-[#eef0fb] border border-[#d6d8ef] rounded-xl w-[7rem] h-[4.5rem]
                             hover:border-[#3D4DB7] hover:text-[#3D4DB7] transition-colors text-[#9090a8]"
                        onClick={videoCallSystem}
                      >
                        <AiOutlineVideoCamera size={22} />
                        <p className="text-xs">Video</p>
                      </div>
                      <div
                        className="flex flex-col items-center justify-center gap-1 cursor-pointer
                             bg-[#eef0fb] border border-[#d6d8ef] rounded-xl w-[7rem] h-[4.5rem]
                             hover:border-[#3D4DB7] hover:text-[#3D4DB7] transition-colors text-[#9090a8]"
                        onClick={videoCallSystem}
                      >
                        <AiOutlinePhone size={22} className="rotate-90" />
                        <p className="text-xs">Audio</p>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="px-4 mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0c8] mb-1">About</p>
                    <p className="text-sm text-[#1a1a2e]">{receiverAbout}</p>
                  </div>

                  {/* Phone */}
                  <div className="px-4 mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0c8] mb-1">Phone number</p>
                    <p className="text-sm text-[#1a1a2e]">{phoneNumber}</p>
                  </div>

                  {/* Block / Report */}
                  <div className="flex justify-between px-4 gap-3 mb-4">
                    <button className="flex-1 py-2 text-sm rounded-xl bg-[#eef0fb] border border-[#d6d8ef]
                                 text-[#9090a8] hover:border-red-400/60 hover:text-red-400 transition-colors">
                      Block
                    </button>
                    <button className="flex-1 py-2 text-sm rounded-xl bg-[#eef0fb] border border-[#d6d8ef]
                                 text-[#9090a8] hover:border-[#3D4DB7]/60 hover:text-[#3D4DB7] transition-colors">
                      Report contact
                    </button>
                  </div>
                </div>
              )}
              {activeSection === "media" && <MediaComponent />}
              {activeSection === "files" && <FilesComponent />}
              {activeSection === "links" && <LinksComponent />}
              {activeSection === "groups" && <GroupsComponent />}
            </div>
          </div>
        </div>
      )}

      {/* ─── Video Call System ─── */}
      {isVideo && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center transition-all duration-300
      ${isFullScreen ? "w-full h-full" : "w-[300px] h-[300px] rounded-2xl overflow-hidden"}`}
          onClick={() => setIsFullScreen(!isFullScreen)}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        >
          <video
            ref={isSwapped ? localVideoRef : remoteVideoRef}
            autoPlay muted={isSwapped} playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            ref={dragRef}
            className="absolute w-[120px] h-[120px] border-2 border-[#3D4DB7]/60 rounded-xl overflow-hidden cursor-move"
            style={{ top: localVideoPos.y, left: localVideoPos.x }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            <video
              ref={isSwapped ? remoteVideoRef : localVideoRef}
              autoPlay muted={!isSwapped} playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ─── Message Section ─── */}
      <div className="w-full bg-cover bg-center flex-1">
        <div className="flex flex-col w-full">

          {/* Chat messages */}
          <div
            ref={chatContainerRef}
            className="lg:max-h-[77vh] max-h-[82.5vh] min-h-[72vh] overflow-y-auto p-4 custom-scrollbar bg-transparent"
          >
            {/* Friend request accepted notice */}
            {relationStatus === "accepted" && (
              <div className="flex justify-center mb-3">
                <div className="bg-[#eef0fb] border border-[#d6d8ef] text-[#9090a8]
                          text-xs px-4 py-1.5 rounded-full">
                  {requestSender === senderId
                    ? `${receiverFullName} accepted your friend request.`
                    : `You accepted ${receiverFullName}'s friend request.`}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full mb-[0.5rem] ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}
                  onContextMenu={(e) => openContextMenu(msg, e)}
                  style={{ width: "fit-content", maxWidth: "60%" }}
                >
                  {msg.fileURL ? (
                    msg.fileType?.startsWith("image/") ? (
                      <img
                        src={msg.fileURL}
                        alt="Sent Image"
                        className="w-40 h-40 object-cover rounded-xl cursor-pointer ring-1 ring-[#d6d8ef]"
                        onClick={() => setSelectedImage(msg.fileURL)}
                      />
                    ) : msg.fileType?.startsWith("video/") ? (
                      <video src={msg.fileURL} controls className="w-60 rounded-xl" />
                    ) : (
                      <a
                        href={msg.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#eef0fb] border border-[#d6d8ef] text-[#1a1a2e]
                             px-3 py-2 rounded-xl min-w-[80px] max-w-full break-words block
                             hover:border-[#3D4DB7]/40 transition-colors"
                      >
                        📄 {msg.fileName}
                      </a>
                    )
                  ) : null}

                  {msg.message && (
                    <div
                      className={`text-[0.95rem] px-4 py-2 min-w-[80px] shadow-sm
                            max-w-full break-words whitespace-pre-line mt-1 block
                  ${msg.sender === "You"
                          ? "bg-[#3D4DB7] text-white rounded-2xl rounded-tr-sm shadow-[#3D4DB7]/20"
                          : "bg-white border border-[#d6d8ef] text-[#1a1a2e] rounded-2xl rounded-tl-sm"}`}
                      style={{ wordBreak: "break-word", whiteSpace: "pre-line" }}
                    >
                      {msg.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Context Menu ─── */}
          {contextMenu.show && (
            <div
              ref={contextRef}
              className="absolute z-10 min-w-[11rem] bg-white border border-[#d6d8ef]
                   rounded-2xl p-2 shadow-xl"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div
                className="cursor-pointer px-3 py-2 rounded-xl hover:bg-[#eef0fb]
                     flex items-center gap-2 text-sm text-[#1a1a2e] transition-colors"
                onClick={copyFunction}
              >
                <FiCopy size={15} /> Copy
              </div>
              <div className="cursor-pointer px-3 py-2 rounded-xl hover:bg-[#eef0fb]
                        flex items-center gap-2 text-sm text-[#1a1a2e] transition-colors">
                <FiStar size={15} /> Star
              </div>
              <div className="h-px bg-[#d6d8ef] my-1" />
              <div
                className="cursor-pointer px-3 py-2 rounded-xl hover:bg-[#eef0fb]
                     flex items-center gap-2 text-sm text-red-400 transition-colors"
                onClick={deleteFunction}
              >
                <FiTrash2 size={15} /> Delete
              </div>
            </div>
          )}

          {/* ─── Delete Confirmation ─── */}
          {delFunc && (
            <div className="fixed inset-0 flex items-center justify-center bg-[#3D4DB7]/10 backdrop-blur-sm z-50">
              <div className="bg-white border border-[#d6d8ef] rounded-2xl p-6 w-72 shadow-2xl text-center">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200
                          flex items-center justify-center mx-auto mb-3">
                  <FiTrash2 size={18} className="text-red-400" />
                </div>
                <p className="text-[#1a1a2e] font-medium mb-4">Delete this message?</p>
                {everyone ? (
                  <>
                    <button
                      className="w-full py-2.5 mb-2 text-sm text-red-400 rounded-xl
                           bg-[#eef0fb] border border-[#d6d8ef] hover:border-red-400/40 transition-colors"
                      onClick={() => Delete("You")}
                    >
                      Delete for everyone
                    </button>
                    <button
                      className="w-full py-2.5 mb-2 text-sm text-[#9090a8] rounded-xl
                           bg-[#eef0fb] border border-[#d6d8ef] hover:border-[#3D4DB7]/40 transition-colors"
                      onClick={() => Delete("Me")}
                    >
                      Delete for me
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full py-2.5 mb-2 text-sm text-[#9090a8] rounded-xl
                         bg-[#eef0fb] border border-[#d6d8ef] hover:border-[#3D4DB7]/40 transition-colors"
                    onClick={() => Delete("Me1")}
                  >
                    Delete for me
                  </button>
                )}
                <button
                  className="w-full py-2.5 text-sm text-[#b0b0c8] rounded-xl
                       hover:bg-[#eef0fb] transition-colors"
                  onClick={() => setDelFunc(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ─── Full Image Preview ─── */}
          {selectedImage && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setSelectedImage(null)}
            >
              <TransformWrapper initialScale={1} wheel={{ step: 0.1 }} pinch={{ step: 5 }} doubleClick={{ disabled: true }}>
                <TransformComponent>
                  <img src={selectedImage} alt="Full Size" className="max-w-full max-h-full rounded-xl" />
                </TransformComponent>
              </TransformWrapper>
            </div>
          )}

          {/* ─── Footer States ─── */}
          {/* No friend */}
          {relationStatus === "unknown" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="bg-white border border-[#d6d8ef] text-[#9090a8]
                        text-sm max-w-[33rem] rounded-xl text-center px-4 py-3">
                If you want to chat with <span className="text-[#1a1a2e] font-medium">{receiverFullName}</span>,
                you need to send a friend request first.
              </div>
              <button
                onClick={sendRequest}
                className="bg-[#3D4DB7] hover:bg-[#3041a3] active:scale-95
                     text-white font-semibold text-sm h-10 px-6 rounded-xl transition-all duration-200"
              >
                Send Request
              </button>
            </div>
          )}

          {/* Sent request */}
          {relationStatus === "pending" && (
            <div className="py-4">
              {requestSender === senderId ? (
                <div className="flex justify-center">
                  <div className="bg-white border border-[#d6d8ef] text-[#9090a8]
                  text-sm max-w-[33rem] rounded-xl text-center px-4 py-3">
                    <div>
                      You sent a friend request to{" "}
                      <span className="text-[#1a1a2e] font-medium">
                        {receiverFullName}
                      </span>
                      .
                    </div>

                    <button
                      type="button"
                      className="mt-3 px-4 py-1.5 rounded-lg border border-[#d6d8ef]
                 bg-[#f8f8fc] text-[#5f6075] text-xs font-medium
                 hover:bg-[#f1f1f8] hover:text-[#1a1a2e]
                 active:scale-95 transition-all duration-150"
                      onClick={() => removeRequest()}
                    >
                      Remove Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white border border-[#d6d8ef] text-[#9090a8]
                            text-sm max-w-[33rem] rounded-xl text-center px-4 py-3">
                    <span className="text-[#1a1a2e] font-medium">{receiverFullName}</span> sent you a friend request.
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => replyRequest(1)}
                      className="bg-[#3D4DB7] hover:bg-[#3041a3] active:scale-95
                           text-white font-semibold text-sm h-10 px-6 rounded-xl transition-all duration-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => replyRequest(0)}
                      className="bg-white border border-[#d6d8ef] hover:border-red-400/60
                           text-red-400 font-semibold text-sm h-10 px-6 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rejected */}
          {relationStatus === "rejected" && (
            <div className="py-4">
              {"requestSender" === senderId ? (
                <div className="flex justify-center">
                  <div className="bg-white border border-[#d6d8ef] text-[#9090a8]
                            text-sm rounded-xl text-center px-4 py-3">
                    <span className="text-[#1a1a2e] font-medium">{receiverName}</span> rejected your friend request.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white border border-[#d6d8ef] text-[#9090a8]
                            text-sm rounded-xl text-center px-4 py-3">
                    You rejected <span className="text-[#1a1a2e] font-medium">{receiverName}</span>'s friend request.
                  </div>
                  <div className="bg-white border border-[#d6d8ef] text-[#9090a8]
                            text-sm rounded-xl text-center px-4 py-3">
                    Send a new request to start chatting.
                  </div>
                  <button
                    onClick={sendRequest}
                    className="bg-[#3D4DB7] hover:bg-[#3041a3] active:scale-95
                         text-white font-semibold text-sm h-10 px-6 rounded-xl transition-all duration-200"
                  >
                    Send Request
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Message Input Bar ─── */}
          {relationStatus === "accepted" && (
            <div className="relative flex items-center h-[4rem] gap-2 px-1">
              {file && (
                <div className="flex items-center gap-2 p-2 bg-white border border-[#d6d8ef]
                          rounded-xl mb-2 absolute bottom-16 left-0">
                  <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                  <span className="truncate text-sm text-[#1a1a2e] max-w-[8rem]">{file.name}</span>
                  <button onClick={() => { setFile(null); setFilePreview(null); }}>
                    <FiX size={18} className="text-[#9090a8] hover:text-[#1a1a2e] transition-colors" />
                  </button>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0
                     bg-[#eef0fb] border border-[#d6d8ef] text-[#3D4DB7]
                     hover:bg-[#3D4DB7] hover:text-white hover:border-[#3D4DB7] transition-colors"
              >
                <FiPaperclip size={18} />
              </button>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              <textarea
                ref={messageInputRef}
                value={message}
                onChange={handleChange}
                placeholder="Type a message…"
                className="flex-1 bg-white border border-[#d6d8ef] text-[#1a1a2e]
                     placeholder-[#b0b0c8] rounded-xl px-4 py-3 text-[0.95rem] resize-none
                     outline-none focus:bg-[#eef0fb] focus:border-[#3D4DB7] transition-all leading-normal"
                rows={1}
                style={{ minHeight: "42px", maxHeight: "120px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0
                     bg-[#3D4DB7] hover:bg-[#3041a3] active:scale-95
                     text-white transition-all shadow-lg shadow-[#3D4DB7]/30"
              >
                <FiSend size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}

export default ChatService;