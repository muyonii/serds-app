import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer, { MediaConnection } from 'peerjs';

interface WebRTCContextType {
  isCalling: boolean;
  isConnected: boolean;
  incomingCalls: any[];
  initiateCall: () => void;
  acceptCall: (citizenId: string) => void;
  endCall: () => void;
  remoteStream: MediaStream | null;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export function WebRTCProvider({ children, isDispatcher = false }: { children: React.ReactNode, isDispatcher?: boolean }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCalls, setIncomingCalls] = useState<any[]>([]);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);
  const myIdRef = useRef<string>("");

  useEffect(() => {
    // Initialize Socket
    const newSocket = io();
    setSocket(newSocket);

    // Initialize PeerJS
    const newPeer = new Peer();
    newPeer.on('open', (id) => {
      myIdRef.current = id;
      console.log('My peer ID is: ' + id);
    });

    setPeer(newPeer);

    return () => {
      newSocket.disconnect();
      newPeer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!socket || !peer) return;

    // Listen for incoming call requests (Dispatcher side)
    socket.on('incoming-call', (data) => {
      if (isDispatcher) {
        setIncomingCalls(prev => [...prev, data]);
      }
    });

    // Listen for call being handled by someone else
    socket.on('call-handled', (data) => {
      if (isDispatcher) {
        setIncomingCalls(prev => prev.filter(c => c.citizenId !== data.citizenId));
      }
    });

    // Listen for accepted call (Citizen side)
    socket.on('call-accepted', (data) => {
      // If this citizen's call was accepted
      if (!isDispatcher && isCalling && socket.id === data.citizenId) {
        setIsCalling(false);
        // Call the dispatcher via PeerJS
        startPeerCall(data.dispatcherPeerId);
      }
    });

    // PeerJS: Answer incoming media connection
    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          call.answer(stream); // Answer the call with our audio stream
          currentCallRef.current = call;
          setIsConnected(true);

          call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
          });
          
          call.on('close', () => {
            endCall();
          });
        })
        .catch((err) => {
          console.error('Failed to get local stream', err);
        });
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-handled');
      socket.off('call-accepted');
    };
  }, [socket, peer, isDispatcher, isCalling]);

  const startPeerCall = (remotePeerId: string) => {
    if (!peer) return;

    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        const call = peer.call(remotePeerId, stream);
        currentCallRef.current = call;
        setIsConnected(true);

        call.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
        });

        call.on('close', () => {
          endCall();
        });
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
        setIsCalling(false);
      });
  };

  const initiateCall = () => {
    if (!socket) return;
    setIsCalling(true);
    socket.emit('request-call', {
      citizenId: socket.id,
      callerName: "Citizen",
      location: "Quezon Blvd, Manila"
    });
  };

  const acceptCall = (citizenId: string) => {
    if (!socket || !peer) return;
    socket.emit('accept-call', {
      citizenId,
      dispatcherId: socket.id,
      dispatcherPeerId: myIdRef.current
    });
    setIncomingCalls(prev => prev.filter(c => c.citizenId !== citizenId));
  };

  const endCall = () => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsCalling(false);
    setIsConnected(false);
    setRemoteStream(null);
  };

  return (
    <WebRTCContext.Provider value={{ isCalling, isConnected, incomingCalls, initiateCall, acceptCall, endCall, remoteStream }}>
      {children}
      {/* Hidden audio element to play remote stream */}
      {remoteStream && (
        <audio 
          autoPlay 
          ref={audio => {
            if (audio && audio.srcObject !== remoteStream) {
              audio.srcObject = remoteStream;
            }
          }} 
        />
      )}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
}
