import { useState } from "react";
import { Video, Users } from "lucide-react";

const MeetingLobby = ({ onJoin }) => {
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");

  const handleJoin = (e) => {
    e.preventDefault();
    if (userName.trim() && roomName.trim()) {
      onJoin(roomName.trim(), userName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0f] font-sans">

      {/* ── Card ── */}
      <div className="w-full max-w-sm mx-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">

        {/* ── Header bar ── */}
        <div className="flex items-center gap-3 px-4 h-[4.5rem] border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-white/40" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0d0f] bg-emerald-400" />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-[0.95rem] font-semibold leading-tight text-slate-100">
              Join Meeting
            </h2>
            <p className="text-xs flex items-center gap-1 font-medium text-emerald-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready to connect
            </p>
          </div>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleJoin} className="p-4 flex flex-col gap-3">

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1">
              Display Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-white/5 border border-white/10 text-white
                         placeholder-white/30 rounded-xl px-4 py-3 text-[0.95rem]
                         outline-none focus:bg-[#4337e6]/10 focus:border-[#4337e6]/50 transition-all"
              required
            />
          </div>

          {/* Room ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1">
              Room ID
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. daily-standup"
              className="w-full bg-white/5 border border-white/10 text-white
                         placeholder-white/30 rounded-xl px-4 py-3 text-[0.95rem]
                         outline-none focus:bg-[#4337e6]/10 focus:border-[#4337e6]/50 transition-all"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!roomName.trim() || !userName.trim()}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl shrink-0
                       bg-gradient-to-br from-[#4337e6] to-[#6d28d9] hover:opacity-90
                       active:scale-95 disabled:opacity-40 disabled:pointer-events-none
                       text-white text-sm font-semibold transition-all shadow-lg shadow-[#4337e6]/30 mt-1"
          >
            <Users className="w-4 h-4" />
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default MeetingLobby;