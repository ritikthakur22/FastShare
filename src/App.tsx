import { useState, useEffect } from 'preact/hooks';
import { Sidebar, ActiveTab } from './ui/Sidebar';
import { TopBar } from './ui/TopBar';
import { FloatingTabBar } from './ui/FloatingTabBar';
import { NearbyScreen } from './screens/NearbyScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { SettingsModal } from './screens/SettingsModal';
import { ReceivingModal } from './screens/ReceivingModal';
import { StorageModal } from './screens/StorageModal';
import { AboutModal } from './screens/AboutModal';
import { LinkDevicesModal } from './screens/LinkDevicesModal';
import { AdvancedSettingsModal } from './screens/AdvancedSettingsModal';
import { SendSheet } from './screens/SendSheet';
import { IncomingTransferSheet, IncomingTransferRequest } from './screens/IncomingTransferSheet';
import { ClipboardModal } from './screens/ClipboardModal';
import { parseEntryLink } from './protocol/links';
import { joinPairing, joinPublicRoom } from './core/rooms';
import { useStore } from './core/useStore';
import { settingsStore, updateSettings } from './core/settings';
import { peersStore, DiscoveredPeer } from './core/peers';
import { transfersStore, addTransferRecord } from './core/transfers';
import { connectSignaling, refreshConnection } from './core/signaling';
import { initWebRTC, sendTextMessage, sendFilesToPeer, onIncomingFile } from './core/rtc';
import { notifyFilesSent, notifyFileReceived, notifyTextSent, notifyIncomingTransfer } from './core/notifications';
import { TransferDetailModal } from './screens/TransferDetailModal';
import { TransferRecord } from './core/transfers';
import { Sheet } from './ui/Sheet';
import { TextField } from './ui/TextField';
import { Button } from './ui/Button';
import { ToastContainer } from './ui/ToastContainer';
import './App.css';

const getInitialTab = (): ActiveTab => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    if (path === '/settings') return 'settings';
    if (path === '/activity' || path === '/history') return 'activity';
  }
  return 'nearby';
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [editingDeviceName, setEditingDeviceName] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState('');

  // Selected peer & Send Sheet state
  const [selectedPeerForSend, setSelectedPeerForSend] = useState<DiscoveredPeer | null>(null);
  const [isSendSheetOpen, setIsSendSheetOpen] = useState(false);

  // Selected transfer for Detail / Note Modal
  const [selectedTransferForDetail, setSelectedTransferForDetail] = useState<TransferRecord | null>(null);

  // Send Tray staged files state (multi-device send)
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  // Incoming transfer request sheet state
  const [incomingRequest, setIncomingRequest] = useState<IncomingTransferRequest | null>(null);

  // Settings & Navigation Modals
  const [isReceivingOpen, setIsReceivingOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLinkDevicesOpen, setIsLinkDevicesOpen] = useState(false);
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const settings = useStore(settingsStore);
  const peersMap = useStore(peersStore);
  const transfers = useStore(transfersStore);

  const peersList = Object.values(peersMap);

  // Dynamic Routing Handler
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'nearby' ? '/' : `/${tab}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  useEffect(() => {
    connectSignaling();
    initWebRTC();

    // Check if initial URL points to a specific screen or modal
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/link' || path === '/pair') {
        setIsLinkDevicesOpen(true);
      }

      // History back/forward navigation support
      const handlePopState = () => {
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath === '/settings') {
          setActiveTab('settings');
        } else if (currentPath === '/activity' || currentPath === '/history') {
          setActiveTab('activity');
        } else if (currentPath === '/' || currentPath === '/nearby') {
          setActiveTab('nearby');
        } else if (currentPath === '/link' || currentPath === '/pair') {
          setIsLinkDevicesOpen(true);
        }
      };

      window.addEventListener('popstate', handlePopState);
    }

    // Parse URL entry points (?pair_key=NNNNNN or ?room_id=xxxxx)
    try {
      const entry = parseEntryLink(window.location.href);
      if (entry) {
        window.history.replaceState({}, '', window.location.pathname);
        if (entry.type === 'pair') {
          joinPairing(entry.key);
          setIsLinkDevicesOpen(true);
        } else if (entry.type === 'room') {
          joinPublicRoom(entry.roomId);
          setIsLinkDevicesOpen(true);
        }
      }
    } catch {
      // ignore
    }

    return onIncomingFile((peerId, name, size) => {
      const peer = peersStore.get()[peerId];
      const alias = peer?.displayName || 'Nearby Device';
      const req: IncomingTransferRequest = {
        senderId: peerId,
        alias,
        deviceName: peer?.deviceName || 'WebRTC Peer',
        ipNetwork: peer?.ipNetwork ?? true,
        files: [
          {
            id: `f-${Date.now()}-${name}`,
            fileName: name,
            size,
            fileType: name.endsWith('.jpg') || name.endsWith('.png') ? 'image' : 'document',
          },
        ],
        totalBytes: size,
      };
      setIncomingRequest(req);
      const sizeStr = size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(size / 1024)} KB`;
      notifyIncomingTransfer(alias, 1, sizeStr);
    });
  }, []);

  const handleEditDeviceName = () => {
    setTempDeviceName(settings.deviceName);
    setEditingDeviceName(true);
  };

  const handleSaveDeviceName = () => {
    if (tempDeviceName.trim()) {
      updateSettings({ deviceName: tempDeviceName.trim() });
    }
    setEditingDeviceName(false);
  };

  // Called when files are dropped or chosen
  const handleFilesSelected = (files: File[]) => {
    setStagedFiles(files);
  };

  // When a peer is tapped on the radar:
  const handlePeerTapped = (peer: DiscoveredPeer) => {
    if (stagedFiles.length > 0) {
      // Direct send staged items to the tapped peer
      handleSendFilesToPeer(peer, stagedFiles);
      setStagedFiles([]);
    } else {
      // Open full Send Sheet
      setSelectedPeerForSend(peer);
      setIsSendSheetOpen(true);
    }
  };

  const handleSendFilesToPeer = (peer: DiscoveredPeer, files: File[]) => {
    sendFilesToPeer(peer.id, files);
    for (const file of files) {
      addTransferRecord({
        id: `send-${Date.now()}-${file.name}`,
        peerId: peer.id,
        peerName: peer.displayName,
        direction: 'sent',
        name: file.name,
        size: file.size,
        timestamp: Date.now(),
        status: 'completed',
      });
    }
    notifyFilesSent(peer.displayName, files);
  };

  const handleSendTextToPeer = (peer: DiscoveredPeer, text: string) => {
    sendTextMessage(peer.id, text);
    notifyTextSent(peer.displayName, text);
  };

  const handleSendStagedToAll = () => {
    if (stagedFiles.length === 0 || peersList.length === 0) return;
    for (const peer of peersList) {
      handleSendFilesToPeer(peer, stagedFiles);
    }
    setStagedFiles([]);
  };

  const handleAcceptIncoming = (chosenIds: string[]) => {
    if (!incomingRequest) return;
    const acceptedFiles = incomingRequest.files.filter((file) => chosenIds.includes(file.id));
    for (const file of acceptedFiles) {
      addTransferRecord({
        id: `recv-${Date.now()}-${file.fileName}`,
        peerId: incomingRequest.senderId,
        peerName: incomingRequest.alias,
        direction: 'received',
        name: file.fileName,
        size: file.size,
        timestamp: Date.now(),
        status: 'completed',
      });
    }
    if (acceptedFiles.length === 1) {
      notifyFileReceived(incomingRequest.alias, acceptedFiles[0].fileName);
    } else if (acceptedFiles.length > 1) {
      notifyFileReceived(incomingRequest.alias, `${acceptedFiles.length} files`);
    }
    setIncomingRequest(null);
  };

  const handleDeclineIncoming = () => {
    setIncomingRequest(null);
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Desktop Left Sidebar with smooth auto-expand on hover */}
      <Sidebar activeTab={activeTab} onSelectTab={handleTabChange} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        {/* Top Header Bar */}
        <TopBar
          onEditDeviceName={handleEditDeviceName}
          onOpenLinkDevices={() => setIsLinkDevicesOpen(true)}
          onOpenSettings={() => handleTabChange('settings')}
          onOpenClipboard={() => setIsClipboardOpen(true)}
        />

        {/* Active Screen */}
        <main style={{ flex: 1, height: 'calc(100% - 64px)', overflow: 'hidden' }}>
          {activeTab === 'nearby' && (
            <NearbyScreen
              peers={peersList}
              history={transfers.history}
              stagedFiles={stagedFiles}
              onSelectPeerForSend={handlePeerTapped}
              onFilesSelected={handleFilesSelected}
              onClearStaged={() => setStagedFiles([])}
              onSendStagedToAll={handleSendStagedToAll}
              onSendMessageClick={() => {
                const target = peersList[0];
                if (target) {
                  setSelectedPeerForSend(target);
                  setIsSendSheetOpen(true);
                } else {
                  setIsLinkDevicesOpen(true);
                }
              }}
              onViewAllActivity={() => handleTabChange('activity')}
              onRefresh={refreshConnection}
              onOpenLinkDevices={() => setIsLinkDevicesOpen(true)}
              onSelectTransfer={setSelectedTransferForDetail}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityScreen
              history={transfers.history}
              onSelectTransfer={setSelectedTransferForDetail}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModal
              onOpenReceiving={() => setIsReceivingOpen(true)}
              onOpenStorage={() => setIsStorageOpen(true)}
              onOpenAbout={() => setIsAboutOpen(true)}
              onOpenLinkDevices={() => setIsLinkDevicesOpen(true)}
              onOpenAdvanced={() => setIsAdvancedOpen(true)}
              onEditDeviceName={handleEditDeviceName}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Tab Bar */}
      <FloatingTabBar activeTab={activeTab} onSelectTab={handleTabChange} />

      {/* Full Send Sheet matching native app send/[id].tsx */}
      <SendSheet
        peer={selectedPeerForSend}
        open={isSendSheetOpen}
        onClose={() => setIsSendSheetOpen(false)}
        onSendFiles={handleSendFilesToPeer}
        onSendText={handleSendTextToPeer}
      />

      {/* Incoming Transfer Prompt Sheet matching native app incoming.tsx */}
      <IncomingTransferSheet
        request={incomingRequest}
        open={incomingRequest !== null}
        onAccept={handleAcceptIncoming}
        onDecline={handleDeclineIncoming}
      />

      {/* Edit Device Name Dialog */}
      <Sheet
        open={editingDeviceName}
        onClose={() => setEditingDeviceName(false)}
        title="Edit Device Name"
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Device Name"
            value={tempDeviceName}
            onChange={setTempDeviceName}
            maxLength={32}
            placeholder="e.g. Redmi Note 9"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setEditingDeviceName(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveDeviceName}>
              Save
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Receiving Settings Modal */}
      <Sheet
        open={isReceivingOpen}
        onClose={() => setIsReceivingOpen(false)}
        title="Receiving"
        maxWidth="500px"
      >
        <ReceivingModal />
      </Sheet>

      {/* Storage Modal */}
      <Sheet
        open={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        title="Storage"
        maxWidth="500px"
      >
        <StorageModal />
      </Sheet>

      {/* About Modal */}
      <Sheet
        open={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title="About FastShare"
        maxWidth="540px"
      >
        <AboutModal />
      </Sheet>

      {/* Advanced Settings Modal */}
      <Sheet
        open={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        title="Advanced settings"
        maxWidth="520px"
      >
        <AdvancedSettingsModal />
      </Sheet>

      {/* Link Devices Modal */}
      <Sheet
        open={isLinkDevicesOpen}
        onClose={() => setIsLinkDevicesOpen(false)}
        title="Link a device"
        maxWidth="460px"
      >
        <LinkDevicesModal />
      </Sheet>

      {/* Clipboard History Modal */}
      <Sheet
        open={isClipboardOpen}
        onClose={() => setIsClipboardOpen(false)}
        title="Saved text clips"
        maxWidth="500px"
      >
        <ClipboardModal
          onClose={() => setIsClipboardOpen(false)}
          onSendText={(text) => {
            const target = selectedPeerForSend ?? peersList[0];
            if (target) {
              handleSendTextToPeer(target, text);
            }
          }}
        />
      </Sheet>

      {/* Note / Transfer Detail Modal */}
      <TransferDetailModal
        transfer={selectedTransferForDetail}
        open={Boolean(selectedTransferForDetail)}
        onClose={() => setSelectedTransferForDetail(null)}
      />

      {/* In-app Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
