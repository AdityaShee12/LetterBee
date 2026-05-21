import { useState } from 'react'
import MeetingLobby from './MeetingLobby'
import MediasoupCall from './MediasoupCall'
import socket from './socket'
import './App.css'

const videoRender = () => {
    const [session, setSession] = useState(null);

    const handleJoin = (roomName, userName) => {
        setSession({ roomName, userName });
    };

    const handleClose = () => {
        setSession(null);
    };

    return (
        <div className="w-full h-screen overflow-hidden bg-slate-950 text-white">
            {!session ? (
                <MeetingLobby onJoin={handleJoin} />
            ) : (
                <MediasoupCall
                    socket={socket}
                    roomName={session.roomName}
                    peerDetails={{ name: session.userName, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.userName}` }}
                    onClose={handleClose}
                />
            )}
        </div>
    )
}

export default videoRender;
