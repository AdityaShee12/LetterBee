import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineVideoCamera } from "react-icons/ai";
import { FiCopy, FiStar, FiTrash2, FiPaperclip, FiSend, FiX } from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const GroupChatPage = () => {
  const dispatch = useDispatch();

  const { groupMessage } = useSelector((state) => state.groupMessage);
  const { user } = useSelector(
    (state) => state.user,
  );
  // Group states
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [groupBio, setGroupBio] = useState("");
  const [groupSubject, setGroupSubject] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [members, setMembers] = useState([]);
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");

  // UI states
  const [profileDetails, setProfileDetails] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const profileRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!groupMessage) return;

    const { _id, name, avatar, bio, subject, createdBy, members } = groupMessage;
    console.log("GMEssg", _id, name, avatar, bio, subject, createdBy, members);

    // Store group data in states
    setGroupId(_id);
    setGroupName(name);
    setGroupAvatar(avatar);
    setGroupBio(bio);
    setGroupSubject(subject);
    setCreatedBy(createdBy);
    setMembers(members || []);
  }, [groupMessage]);

  // Destructure id, email, userName and assign those data on useState variable
  useEffect(() => {
    const { _id, email, fullName, userName, avatar, about } = user;
    setUserId(_id);
    setSenderAvatar(avatar);
    setFullName(fullName);
    setEmail(email);
    setUserName(userName);
    setAbout(about);
  }, [user]);

  const openProfileContext = (e) => {
    e.stopPropagation();
    setProfileDetails((prev) => !prev);
  };

  // ─── Send message over socket, matching Message schema ───
  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed || !groupId) return;

    // Confirm the logged-in user is actually a member of this group,
    // and use that matched member's id as the senderId.
    const matchedMember = members.find((m) => m._id === userId);
    if (!matchedMember) {
      console.warn("Current user is not a member of this group — message not sent.");
      return;
    }

    const senderId = matchedMember._id;
    const receiverIds = members
      .filter((m) => m._id !== senderId)
      .map((m) => m._id);

    const payload = {
      groupId,
      sender: senderId,
      receiver: receiverIds,
      textSms: trimmed,
    };

    // Optimistic local render
    setMessages((prev) => [...prev, { ...payload, _id: `temp-${Date.now()}`, createdAt: new Date().toISOString() }]);

    socket.emit("sendGroupMessage", payload);

    setMessage("");
  };

  const overview = () => setActiveSection("profile");
  const media = () => setActiveSection("media");
  const links = () => setActiveSection("links");
  const files = () => setActiveSection("files");
  const membersTab = () => setActiveSection("members");

  const createdByMember = members.find((m) => m._id === createdBy);

  return (
    <div className="flex flex-col items-center justify-between mt-[0.7rem] pl-[0.9rem] pr-[0.9rem] bg-[#f0f1f8] min-h-screen w-full relative z-10">

      {/* ─── Header / Group bar ─── */}
      <div
        className="flex justify-between items-center w-full rounded-xl h-[4.5rem] cursor-pointer
             bg-white border border-[#d6d8ef] px-3 sticky top-0 z-30"
        onClick={(e) => openProfileContext(e)}
      >
        {/* Avatar + Name + Member count */}
        <div className="flex items-center gap-3">
          <img
            src={groupAvatar}
            alt=""
            className="w-11 h-11 rounded-full object-cover border border-[#d6d8ef]"
          />

          <div className="flex flex-col justify-center">
            <h2 className="text-[0.95rem] font-semibold leading-tight text-[#1a1a2e]">
              {groupName}
            </h2>
            <p className="text-xs text-[#9090a8] font-medium">
              {members.length} {members.length === 1 ? "member" : "members"}
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

      {/* ─── Group Details Panel ─── */}
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
                { label: "Links", fn: links },
                { label: "Files", fn: files },
                { label: "Members", fn: membersTab },
              ].map(({ label, fn }) => (
                <div
                  key={label}
                  onClick={(e) => {
                    e.stopPropagation();
                    fn();
                  }}
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
                    {/* Group Avatar */}
                    <div
                      className={`${isZoomed
                        ? "fixed bg-black flex justify-center items-center inset-0 z-50"
                        : "relative w-28 h-28"
                        }`}
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
                            <img src={groupAvatar} alt="group" className="w-[48vw] h-[95vh]" />
                          </TransformComponent>
                        </TransformWrapper>
                      ) : (
                        <img
                          src={groupAvatar}
                          alt=""
                          onClick={() => setIsZoomed(true)}
                          className="absolute w-28 h-28 rounded-full cursor-pointer
                               ring-2 ring-[#3D4DB7]/30 object-cover"
                        />
                      )}
                    </div>

                    {/* Name + member badge */}
                    <div className="flex items-center gap-2 mt-4">
                      <h2 className="text-xl font-bold text-[#1a1a2e]">{groupName}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#eef0fb] text-[#9090a8]">
                        {members.length} {members.length === 1 ? "member" : "members"}
                      </span>
                    </div>

                    {/* Subject */}
                    {groupSubject && (
                      <p className="text-sm text-[#9090a8] mt-1">{groupSubject}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="px-4 mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0c8] mb-1">Group bio</p>
                    <p className="text-sm text-[#1a1a2e]">{groupBio}</p>
                  </div>

                  {/* Created by */}
                  <div className="px-4 mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0c8] mb-1">Created by</p>
                    <div className="flex items-center gap-2">
                      {createdByMember?.avatar && (
                        <img
                          src={createdByMember.avatar}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-[#d6d8ef]"
                        />
                      )}
                      <p className="text-sm text-[#1a1a2e]">
                        {createdByMember?.name || createdBy || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {/* Exit / Report */}
                  <div className="flex justify-between px-4 gap-3 mb-4">
                    <button className="flex-1 py-2 text-sm rounded-xl bg-[#eef0fb] border border-[#d6d8ef]
                                 text-[#9090a8] hover:border-red-400/60 hover:text-red-400 transition-colors">
                      Exit group
                    </button>
                    <button className="flex-1 py-2 text-sm rounded-xl bg-[#eef0fb] border border-[#d6d8ef]
                                 text-[#9090a8] hover:border-[#3D4DB7]/60 hover:text-[#3D4DB7] transition-colors">
                      Report group
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "members" && (
                <div className="px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0b0c8] mb-3">
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </p>
                  <div className="flex flex-col gap-3">
                    {members.map((m) => (
                      <div key={m._id} className="flex items-center gap-3">
                        <img
                          src={m.avatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-[#d6d8ef]"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-[#1a1a2e] font-medium">{m.name}</span>
                          {m._id === createdBy && (
                            <span className="text-xs text-[#3D4DB7]">Group admin</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "media" && (
                <div className="px-4 py-4 text-sm text-[#9090a8]">No media yet.</div>
              )}
              {activeSection === "files" && (
                <div className="px-4 py-4 text-sm text-[#9090a8]">No files yet.</div>
              )}
              {activeSection === "links" && (
                <div className="px-4 py-4 text-sm text-[#9090a8]">No links yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Message Section ─── */}
      <div className="w-full bg-cover bg-center flex-1">
        <div className="flex flex-col w-full">
          <div
            ref={chatContainerRef}
            className="lg:max-h-[77vh] max-h-[82.5vh] min-h-[72vh] overflow-y-auto p-4 custom-scrollbar bg-transparent"
          >
            {/* Group messages render here, same pattern as the direct-message list */}
          </div>

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

          {/* ─── Message Input Bar ─── */}
          <div className="relative flex items-center h-[4rem] gap-2 px-1">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0
                   bg-[#eef0fb] border border-[#d6d8ef] text-[#3D4DB7]
                   hover:bg-[#3D4DB7] hover:text-white hover:border-[#3D4DB7] transition-colors"
            >
              <FiPaperclip size={18} />
            </button>

            <textarea
              placeholder="Type a message…"
              className="flex-1 bg-white border border-[#d6d8ef] text-[#1a1a2e]
                   placeholder-[#b0b0c8] rounded-xl px-4 py-3 text-[0.95rem] resize-none
                   outline-none focus:bg-[#eef0fb] focus:border-[#3D4DB7] transition-all leading-normal"
              rows={1}
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />

            <button
              className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0
                   bg-[#3D4DB7] hover:bg-[#3041a3] active:scale-95
                   text-white transition-all shadow-lg shadow-[#3D4DB7]/30"
            >
              <FiSend size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatPage;