import { updatePeerState, updatePeerName, peersStore } from './peers';
import { parseChannelMessage, serializeChannelMessage } from '../protocol/channel';
import { encodeWebText, decodeWebText } from '../protocol/webText';
import { addTransferRecord, updateActiveTransfer } from './transfers';
import { sendSignal, onSignal } from './signaling';
import { settingsStore } from './settings';
import { notifyTextReceived } from './notifications';

export interface PeerConnection {
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
}

const connections: Record<string, PeerConnection> = {};
let incomingFileHandlers: ((peerId: string, name: string, size: number) => void)[] = [];

let currentRtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function setRtcConfig(config: RTCConfiguration) {
  if (config && config.iceServers) {
    currentRtcConfig = config;
  }
}

export function onIncomingFile(handler: (peerId: string, name: string, size: number) => void) {
  incomingFileHandlers.push(handler);
  return () => {
    incomingFileHandlers = incomingFileHandlers.filter((h) => h !== handler);
  };
}

export function initWebRTC() {
  if (typeof window === 'undefined') return;

  onSignal(async (sender, message) => {
    let conn = connections[sender];
    if (!conn) {
      conn = createPeerConnection(sender);
    }

    if (message.sdp) {
      try {
        await conn.pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        if (message.sdp.type === 'offer') {
          const answer = await conn.pc.createAnswer();
          await conn.pc.setLocalDescription(answer);
          sendSignal(sender, { sdp: conn.pc.localDescription });
        }
      } catch (err) {
        console.error('Failed to handle SDP signal:', err);
      }
    } else if (message.candidate || message.ice) {
      const cand = message.candidate || message.ice;
      try {
        await conn.pc.addIceCandidate(new RTCIceCandidate(cand!));
      } catch {
        // ignore candidate errors
      }
    }
  });
}

export function createPeerConnection(peerId: string, roomType = 'ip', roomId?: string): PeerConnection {
  if (connections[peerId]) return connections[peerId];

  const pc = new RTCPeerConnection(currentRtcConfig);
  const conn: PeerConnection = { pc };
  connections[peerId] = conn;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(peerId, { candidate: event.candidate }, roomType, roomId);
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      updatePeerState(peerId, 'connected');
    } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      updatePeerState(peerId, 'failed');
    }
  };

  pc.ondatachannel = (event) => {
    setupDataChannel(peerId, event.channel);
  };

  return conn;
}

export function closePeerConnection(peerId: string) {
  const conn = connections[peerId];
  if (conn) {
    try {
      conn.dc?.close();
      conn.pc.close();
    } catch {
      // ignore
    }
    delete connections[peerId];
  }
}

export async function connectToPeer(peerId: string, roomType = 'ip', roomId?: string) {
  let conn = connections[peerId];
  if (!conn) {
    conn = createPeerConnection(peerId, roomType, roomId);
  }
  if (conn.pc.signalingState !== 'stable') return;

  const dc = conn.pc.createDataChannel('fastshare', { ordered: true });
  setupDataChannel(peerId, dc);

  try {
    const offer = await conn.pc.createOffer();
    await conn.pc.setLocalDescription(offer);
    sendSignal(peerId, { sdp: conn.pc.localDescription }, roomType, roomId);
  } catch (err) {
    console.error('Failed to create offer:', err);
  }
}

function setupDataChannel(peerId: string, dc: RTCDataChannel) {
  connections[peerId].dc = dc;
  dc.binaryType = 'arraybuffer';

  dc.onopen = () => {
    updatePeerState(peerId, 'connected');
    // Announce my display name
    const { deviceName } = settingsStore.get();
    dc.send(serializeChannelMessage({ type: 'display-name-changed', displayName: deviceName }));
  };

  dc.onmessage = (event) => {
    if (typeof event.data === 'string') {
      const msg = parseChannelMessage(event.data);
      if (!msg) return;

      switch (msg.type) {
        case 'display-name-changed':
          updatePeerName(peerId, msg.displayName);
          break;
        case 'text': {
          const peerName = peersStore.get()[peerId]?.displayName || 'Nearby Device';
          const displayText = decodeWebText(msg.text) ?? msg.text;
          addTransferRecord({
            id: `msg-${Date.now()}`,
            peerId,
            peerName,
            direction: 'received',
            name: displayText.slice(0, 30) + (displayText.length > 30 ? '...' : ''),
            size: displayText.length,
            timestamp: Date.now(),
            status: 'completed',
          });
          notifyTextReceived(peerName, displayText);
          break;
        }
        case 'header': {
          const peerName = peersStore.get()[peerId]?.displayName || 'Nearby Device';
          updateActiveTransfer(`recv-${msg.name}`, {
            id: `recv-${msg.name}`,
            peerId,
            peerName,
            direction: 'received',
            name: msg.name,
            size: msg.size,
            timestamp: Date.now(),
            status: 'transferring',
            progress: 0,
          });
          for (const handler of incomingFileHandlers) {
            handler(peerId, msg.name, msg.size);
          }
          break;
        }
      }
    }
  };
}

export function sendTextMessage(peerId: string, text: string) {
  const conn = connections[peerId];
  if (conn?.dc && conn.dc.readyState === 'open') {
    conn.dc.send(serializeChannelMessage({ type: 'text', text: encodeWebText(text) }));
    addTransferRecord({
      id: `sent-${Date.now()}`,
      peerId,
      peerName: 'Nearby Device',
      direction: 'sent',
      name: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
      size: text.length,
      timestamp: Date.now(),
      status: 'completed',
    });
  }
}

export function sendFilesToPeer(peerId: string, files: File[]) {
  const conn = connections[peerId];
  for (const file of files) {
    if (conn?.dc && conn.dc.readyState === 'open') {
      conn.dc.send(
        serializeChannelMessage({
          type: 'header',
          name: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
        })
      );
    }
  }
}
