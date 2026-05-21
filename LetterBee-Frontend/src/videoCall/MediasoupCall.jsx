import React, { useState, useEffect, useRef } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, ArrowLeftRight } from 'lucide-react';

const RemoteVideo = ({ videoTrack, audioTrack, peerData }) => {
  const videoRef = useRef();
  const audioRef = useRef();

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error("Video play blocked.", e));
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioRef.current && audioTrack) {
      const stream = new MediaStream([audioTrack]);
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((e) => console.error("Audio play blocked.", e));
    }
  }, [audioTrack]);

  return (
    <div className="w-full h-full">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
};

const MediasoupCall = ({ socket, roomName, peerDetails, onClose }) => {
  const deviceRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);

  const audioProducerRef = useRef(null);
  const videoProducerRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const consumersRef = useRef({});

  // ── Two separate refs for local video (big screen & small screen) ──
  const localVideoMainRef = useRef(null);
  const localVideoSmallRef = useRef(null);

  // ── Drag state ──
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [localVideoPos, setLocalVideoPos] = useState({ x: 16, y: 80 });

  // ── Sync localStream to both video elements whenever stream or swap changes ──
  useEffect(() => {
    if (!localStream) return;
    if (localVideoMainRef.current) {
      localVideoMainRef.current.srcObject = localStream;
      localVideoMainRef.current.play().catch((e) => console.error("Local main video play blocked.", e));
    }
    if (localVideoSmallRef.current) {
      localVideoSmallRef.current.srcObject = localStream;
      localVideoSmallRef.current.play().catch((e) => console.error("Local small video play blocked.", e));
    }
  }, [localStream, isSwapped]);

  // ── Drag handlers ──
  const startDrag = (e) => {
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: clientX - localVideoPos.x,
      y: clientY - localVideoPos.y,
    };

    const onMove = (moveEvent) => {
      if (!isDragging.current) return;
      const mx = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const my = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const newX = mx - dragOffset.current.x;
      const newY = my - dragOffset.current.y;
      const maxX = window.innerWidth - 110;
      const maxY = window.innerHeight - 150;
      setLocalVideoPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const swapVideos = () => {
    setIsSwapped((prev) => !prev);
  };

  // ── Mediasoup init ──
  useEffect(() => {
    let unmounted = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (unmounted) return;
        setLocalStream(stream);
        // srcObject will be set by the useEffect above once localStream state updates

        socket.emit("join-room", { roomName, peerDetails }, async ({ rtpCapabilities, error }) => {
          if (error) return console.error(error);
          const newDevice = new mediasoupClient.Device();
          await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
          if (unmounted) return;
          deviceRef.current = newDevice;
          initTransports(newDevice, stream);
        });
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    init();

    socket.on("new-producer", ({ producerId, peerId, peerDetails }) => {
      consume(producerId, peerId, peerDetails, deviceRef.current);
    });

    socket.on("producer-closed", ({ producerId }) => {
      setRemoteStreams((prev) => ({ ...prev }));
    });

    socket.on("peer-disconnected", ({ peerId }) => {
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[peerId];
        return updated;
      });
    });

    return () => {
      unmounted = true;
      socket.off("new-producer");
      socket.off("producer-closed");
      socket.off("peer-disconnected");
      if (sendTransportRef.current) sendTransportRef.current.close();
      if (recvTransportRef.current) recvTransportRef.current.close();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const initTransports = (dev, stream) => {
    // Send Transport
    socket.emit("createWebRtcTransport", {}, async ({ params }) => {
      const sendTransport = dev.createSendTransport(params);
      sendTransportRef.current = sendTransport;

      sendTransport.on("connectionstatechange", (state) => {
        console.log(`[SFU] Send: ${state}`);
      });
      sendTransport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit("connectTransport", { transportId: sendTransport.id, dtlsParameters }, callback);
      });
      sendTransport.on("produce", ({ kind, rtpParameters, appData }, callback) => {
        socket.emit("produce", { transportId: sendTransport.id, kind, rtpParameters, appData }, ({ id }) => {
          callback({ id });
        });
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) videoProducerRef.current = await sendTransport.produce({ track: videoTrack });
      if (audioTrack) audioProducerRef.current = await sendTransport.produce({ track: audioTrack });
    });

    // Recv Transport
    socket.emit("createWebRtcTransport", {}, async ({ params }) => {
      const recvTransport = dev.createRecvTransport(params);
      recvTransportRef.current = recvTransport;

      recvTransport.on("connectionstatechange", (state) => {
        console.log(`[SFU] Recv: ${state}`);
      });
      recvTransport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit("connectTransport", { transportId: recvTransport.id, dtlsParameters }, callback);
      });

      socket.emit("get-producers", (producers) => {
        for (const producer of producers) {
          consume(producer.producerId, producer.peerId, producer.peerDetails, dev, recvTransport);
        }
      });
    });
  };

  const consume = async (producerId, peerId, peerData, dev, rTransport) => {
    const transport = rTransport || recvTransportRef.current;
    if (!dev || !transport) return console.warn("Skipping consume, transport not ready");

    socket.emit(
      "consume",
      { transportId: transport.id, producerId, rtpCapabilities: dev.rtpCapabilities },
      async ({ params, error }) => {
        if (error) return console.error("consume error:", error);
        const consumer = await transport.consume(params);
        consumersRef.current[consumer.id] = consumer;
        const track = consumer.track;

        setRemoteStreams((prev) => {
          const streamInfo = prev[peerId] || { videoTrack: null, audioTrack: null, peerData };
          return {
            ...prev,
            [peerId]: {
              ...streamInfo,
              ...(track.kind === "video" ? { videoTrack: track } : { audioTrack: track }),
            },
          };
        });

        socket.emit("resume-consumer", { consumerId: consumer.id }, () => { });
      }
    );
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // ── Remote entries for big/small screens ──
  const remoteEntries = Object.entries(remoteStreams);
  const primaryRemote = isSwapped ? null : remoteEntries[0];
  const extraRemotes = isSwapped ? remoteEntries : remoteEntries.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0d0f] font-sans overflow-hidden">

      {/* ── Main Video Area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* ── Big Screen ── */}
        <div className="absolute inset-0">
          {primaryRemote ? (
            <RemoteVideo
              videoTrack={primaryRemote[1].videoTrack}
              audioTrack={primaryRemote[1].audioTrack}
              peerData={primaryRemote[1].peerData}
            />
          ) : isSwapped ? (
            // Local video is swapped to big screen
            <video
              ref={localVideoMainRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover bg-slate-900"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-white/30" />
              </div>
              <p className="text-xs text-slate-500 font-medium">Waiting for others to join...</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* ── Small Draggable Screen ── */}
        <div
          ref={dragRef}
          className="absolute w-[110px] h-[150px] rounded-2xl overflow-hidden border border-white/10
                     shadow-2xl cursor-move z-20"
          style={{ top: localVideoPos.y, left: localVideoPos.x }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onPointerDown={(e) => {
            const timer = setTimeout(() => swapVideos(), 600);
            e.currentTarget._swapTimer = timer;
          }}
          onPointerUp={(e) => clearTimeout(e.currentTarget._swapTimer)}
          onPointerLeave={(e) => clearTimeout(e.currentTarget._swapTimer)}
        >
          {/* Small screen content: remote if swapped, local otherwise */}
          {isSwapped && remoteEntries[0] ? (
            <RemoteVideo
              videoTrack={remoteEntries[0][1].videoTrack}
              audioTrack={remoteEntries[0][1].audioTrack}
              peerData={remoteEntries[0][1].peerData}
            />
          ) : (
            // Always render local video element; srcObject kept in sync by useEffect
            <video
              ref={localVideoSmallRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover bg-slate-900"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Name tag */}
          <div className="absolute bottom-2 left-2">
            <div className="bg-slate-800/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[10px] font-medium
                            flex items-center gap-1 border border-white/10">
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
              {isSwapped ? (remoteEntries[0]?.[1]?.peerData?.name || "Remote") : "You"}
              {!isSwapped && isMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
            </div>
          </div>

          {/* Video off overlay (only for local) */}
          {!isSwapped && isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-white/30" />
              </div>
            </div>
          )}

          {/* Swap hint */}
          <div className="absolute top-1.5 right-1.5 opacity-50">
            <div className="w-4 h-4 rounded-md bg-white/10 border border-white/10 flex items-center justify-center">
              <ArrowLeftRight className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>

        {/* Extra remote videos — bottom strip */}
        {extraRemotes.length > 0 && (
          <div className="absolute bottom-[4.5rem] left-0 right-0 flex gap-2 px-3 overflow-x-auto pb-1 z-10">
            {extraRemotes.map(([peerId, streamInfo]) => (
              <div key={peerId} className="w-[80px] h-[100px] rounded-xl overflow-hidden border border-white/10 shrink-0">
                <RemoteVideo
                  videoTrack={streamInfo.videoTrack}
                  audioTrack={streamInfo.audioTrack}
                  peerData={streamInfo.peerData}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 h-[4.5rem] flex items-center justify-between px-4
                      bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-[0.95rem] font-semibold leading-tight text-slate-100">Group Video Call</h2>
            <p className="text-xs flex items-center gap-1 font-medium text-emerald-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {roomName.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10
                        px-3 py-1.5 rounded-xl pointer-events-auto backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-400 font-medium">Secure SFU</span>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[4rem] flex items-center justify-center gap-3 px-4
                      bg-white/5 border-t border-white/10 backdrop-blur-xl">
        <button
          onClick={toggleMute}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 border
            ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/10 border-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 border
            ${isVideoOff ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/10 border-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0
                     bg-gradient-to-br from-red-600 to-red-700 hover:opacity-90 active:scale-95
                     text-white transition-all shadow-lg shadow-red-600/30 border border-red-500/30"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MediasoupCall;