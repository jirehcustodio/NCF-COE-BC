import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, LogEntry, Notice } from './Shared';

export default function ProfileModal({
  open,
  onClose,
  profile,
  roleLabel,
  program,
  logs = [],
  saving = false,
  onSave,
  onUploadAvatar,
}) {
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const dropRef = useRef(null);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => (a.time < b.time ? 1 : -1)),
    [logs]
  );

  useEffect(() => {
    setName(profile?.name || '');
    setAvatarUrl(profile?.avatar_url || '');
    setPreviewUrl('');
    setZoom(1);
    setCroppedBlob(null);
  }, [profile?.name, profile?.avatar_url, open]);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const initials = useMemo(() => {
    const value = (profile?.name || name || '').trim();
    if (!value) return '—';
    return value.split(' ').slice(0, 2).map(part => part[0].toUpperCase()).join('');
  }, [profile?.name, name]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please provide your name.');
      return;
    }
    setError('');
    if (onSave) {
      onSave({ name: trimmed, avatar_url: avatarUrl.trim(), avatarFile: croppedBlob });
    }
  }

  async function handleFileInput(file) {
    if (!file) return;
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
    setCroppedBlob(null);
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileInput(file);
  }

  async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileInput(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  async function applyCrop() {
    if (!previewUrl) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = previewUrl;
    await new Promise(resolve => {
      image.onload = resolve;
    });
    const size = 360;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const shortest = Math.min(image.width, image.height);
    const cropSize = shortest / zoom;
    const sx = (image.width - cropSize) / 2;
    const sy = (image.height - cropSize) / 2;
    ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, size, size);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    setCroppedBlob(blob);
    const previewBlobUrl = URL.createObjectURL(blob);
    setAvatarUrl(previewBlobUrl);
  }

  if (!open) return null;

  return (
    <div className="modal-bg open">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-hdr">
          <h3>Profile</h3>
          <button className="close-btn" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-meta">
          <div className="row">
            <span>Role</span>
            <span>{roleLabel}</span>
          </div>
          {program && (
            <div className="row">
              <span>Program</span>
              <span>{program}</span>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-avatar" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>
            {!avatarUrl && initials}
          </div>
          <div className="profile-fields">
            <div className="fg">
              <label>Name</label>
              <input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" />
            </div>
            <div className="fg">
              <label>Profile photo</label>
              <div
                className="dropzone"
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  disabled={uploading}
                />
                <div>
                  <strong>Drag & drop</strong> or click to upload
                </div>
                <div className="muted-text">PNG/JPG up to 5MB</div>
              </div>
              {previewUrl && (
                <div className="cropper">
                  <img src={previewUrl} alt="Preview" />
                  <div className="crop-controls">
                    <label>Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.1"
                      value={zoom}
                      onChange={event => setZoom(Number(event.target.value))}
                    />
                    <button className="btn sm" type="button" onClick={applyCrop}>Apply crop</button>
                  </div>
                </div>
              )}
              <input
                value={avatarUrl}
                onChange={event => setAvatarUrl(event.target.value)}
                placeholder="Or paste an image URL"
              />
            </div>
          </div>
        </div>

        {error && <div className="landing-error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn pri" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>

        <Notice type="info" icon="ti-activity">
          Activity logs are visible to your account only.
        </Notice>

        {sortedLogs.length === 0 ? (
          <EmptyState icon="ti-clipboard-x">No activity logs yet.</EmptyState>
        ) : (
          <div className="log-list">
            {sortedLogs.map((entry, index) => (
              <LogEntry key={`${entry.time}-${index}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
