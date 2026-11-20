import { useState } from 'preact/hooks';
import { BrandMark } from '../ui/BrandMark';
import { Icon } from '../ui/Icon';
import { Segmented } from '../ui/Segmented';
import { useStore } from '../core/useStore';
import { settingsStore } from '../core/settings';
import { signalingStore } from '../core/signaling';

type AboutTab = 'about' | 'privacy' | 'terms' | 'license';

export function AboutModal() {
  const [activeTab, setActiveTab] = useState<AboutTab>('about');
  const [copiedDebug, setCopiedDebug] = useState(false);

  const settings = useStore(settingsStore);
  const signaling = useStore(signalingStore);

  const tabs: { value: AboutTab; label: string }[] = [
    { value: 'about', label: 'About' },
    { value: 'privacy', label: 'Privacy' },
    { value: 'terms', label: 'Terms' },
    { value: 'license', label: 'License' },
  ];

  const handleCopyDebug = async () => {
    const info = {
      app: 'FastShare Web',
      version: '2.0.0',
      author: 'Ritik Thakur',
      github: 'ritikthakur22',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      theme: settings.theme,
      accent: settings.accent,
      signalingConnected: signaling.connected,
      webrtcSupported: typeof RTCPeerConnection !== 'undefined',
      serviceWorkerSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
      setCopiedDebug(true);
      setTimeout(() => setCopiedDebug(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
      {/* Top Segmented Tab Switcher */}
      <Segmented
        options={tabs}
        value={activeTab}
        onChange={(val) => setActiveTab(val as AboutTab)}
      />

      {/* Tab 1: About */}
      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '8px' }}>
          <BrandMark size={56} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '14px', color: 'var(--fs-text)' }}>
            FastShare
          </h2>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'var(--fs-accent)',
              backgroundColor: 'var(--fs-accent-tint)',
              padding: '2px 10px',
              borderRadius: 'var(--fs-radius-pill)',
              marginTop: '4px',
            }}
          >
            Version 2.0.0 Web
          </span>

          <p style={{ fontSize: '0.9rem', color: 'var(--fs-text-2)', margin: '14px 0 20px 0', maxWidth: '360px', lineHeight: '1.5' }}>
            Direct, zero-install WebRTC peer-to-peer sharing between devices on the web and native apps. No cloud, no accounts, and no tracking.
          </p>

          {/* Author info card */}
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '12px 16px',
              borderRadius: 'var(--fs-radius-row)',
              backgroundColor: 'var(--fs-bg)',
              border: '1px solid var(--fs-separator)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--fs-text-3)', display: 'block' }}>
                Developer & Owner
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--fs-text)' }}>
                Ritik Thakur
              </span>
            </div>
            <a
              href="https://github.com/ritikthakur22"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.85rem',
                color: 'var(--fs-accent)',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              @ritikthakur22
            </a>
          </div>

          {/* Links list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '380px' }}>
            <a
              href="https://fastshare.ritikthakur.com.np"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--fs-bg)',
                border: '1px solid var(--fs-separator)',
                borderRadius: 'var(--fs-radius-row)',
                color: 'var(--fs-text)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="public" size={18} color="var(--fs-accent)" />
                <span>Official Website</span>
              </div>
              <Icon name="chevron_right" size={14} color="var(--fs-text-3)" />
            </a>

            <a
              href="https://github.com/ritikthakur22/FastShare"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--fs-bg)',
                border: '1px solid var(--fs-separator)',
                borderRadius: 'var(--fs-radius-row)',
                color: 'var(--fs-text)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="code" size={18} color="var(--fs-accent)" />
                <span>Source Code (GitHub)</span>
              </div>
              <Icon name="chevron_right" size={14} color="var(--fs-text-3)" />
            </a>

            <button
              onClick={handleCopyDebug}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--fs-bg)',
                border: '1px solid var(--fs-separator)',
                borderRadius: 'var(--fs-radius-row)',
                color: 'var(--fs-text)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name={copiedDebug ? 'check' : 'code'} size={18} color="var(--fs-accent)" />
                <span>{copiedDebug ? 'Debug Info Copied!' : 'Copy Debug Info'}</span>
              </div>
              <Icon name="content_copy" size={14} color="var(--fs-text-3)" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Privacy Policy */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--fs-text-2)', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="policy" size={20} color="var(--fs-accent)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)' }}>
              Privacy Policy
            </h3>
          </div>

          <p>
            FastShare was built with a fundamental commitment to privacy: <strong>your data belongs to you alone</strong>.
          </p>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              1. Zero Cloud Storage & Zero Intermediaries
            </h4>
            <p>
              Files and messages you send never touch a central server, cloud storage bucket, or database. Every byte travels directly from sender to receiver via encrypted WebRTC data channels.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              2. End-to-End Encryption
            </h4>
            <p>
              All peer-to-peer data channels use DTLS (Datagram Transport Layer Security) and SRTP encryption out of the box, ensuring that no eavesdropper or internet service provider can read your files in transit.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              3. Ephemeral Signaling Only
            </h4>
            <p>
              The signaling server is used solely for the initial WebRTC connection handshake (exchanging public network session descriptions and ICE candidates). Transfer payloads, file contents, and message bodies are never routed through or logged by the signaling server.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              4. No Analytics, Trackers, or Cookies
            </h4>
            <p>
              FastShare contains zero analytics scripts, zero tracking pixels, zero marketing cookies, and zero third-party advertising SDKs.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              5. Local Storage Only
            </h4>
            <p>
              All preferences (device name, theme, color choice, and activity history) stay strictly inside your browser's private local storage. You can delete them at any time in Storage settings.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Terms of Service */}
      {activeTab === 'terms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--fs-text-2)', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="gavel" size={20} color="var(--fs-accent)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)' }}>
              Terms of Service
            </h3>
          </div>

          <p>
            Please read these terms carefully before using FastShare.
          </p>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              1. Acceptance of Terms
            </h4>
            <p>
              By accessing or using FastShare at fastshare.ritikthakur.com.np or through its native applications, you agree to comply with and be bound by these terms.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              2. Permitted Lawful Use
            </h4>
            <p>
              FastShare is provided as a utility for personal and organizational device-to-device file transfer. You agree to use FastShare only for lawful purposes and in accordance with all applicable local, national, and international laws.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              3. User Content & Responsibility
            </h4>
            <p>
              You maintain sole legal responsibility for all files, data, links, or text messages transmitted from your device. You must not send malicious software, viruses, or unauthorized copyright-infringing content.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              4. Disclaimer of Warranty
            </h4>
            <p>
              FastShare is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied, including fitness for a particular purpose or non-infringement.
            </p>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginBottom: '4px' }}>
              5. Limitation of Liability
            </h4>
            <p>
              In no event shall the author, developer, or contributors be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use FastShare.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: License & Credits */}
      {activeTab === 'license' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--fs-text-2)', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="shield" size={20} color="var(--fs-accent)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--fs-text)' }}>
              License & Credits
            </h3>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-row)', border: '1px solid var(--fs-separator)' }}>
            <p style={{ fontWeight: '700', color: 'var(--fs-text)', fontSize: '0.95rem' }}>
              FastShare Web Client
            </p>
            <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>
              Copyright © 2026 <strong>Ritik Thakur</strong>. All rights reserved.
            </p>
            <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--fs-text-3)' }}>
              Clean-room WebRTC peer-to-peer browser client designed and engineered to be fully wire-compatible with the FastShare Native App ecosystem.
            </p>
          </div>

          <h4 style={{ fontWeight: '700', color: 'var(--fs-text)', marginTop: '6px' }}>
            Third-Party Open Source Components
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-control)', border: '1px solid var(--fs-separator)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--fs-text)' }}>Google Material Symbols</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--fs-accent)' }}>Apache 2.0</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-3)', marginTop: '2px' }}>
                Copyright Google LLC. Used under the Apache License 2.0.
              </p>
            </div>

            <div style={{ padding: '10px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-control)', border: '1px solid var(--fs-separator)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--fs-text)' }}>Preact & Preact Hooks</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--fs-accent)' }}>MIT License</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-3)', marginTop: '2px' }}>
                Copyright Jason Miller. Used under the MIT License.
              </p>
            </div>

            <div style={{ padding: '10px 14px', backgroundColor: 'var(--fs-bg)', borderRadius: 'var(--fs-radius-control)', border: '1px solid var(--fs-separator)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--fs-text)' }}>Vite</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--fs-accent)' }}>MIT License</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--fs-text-3)', marginTop: '2px' }}>
                Copyright Evan You & Vite contributors. Used under the MIT License.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
