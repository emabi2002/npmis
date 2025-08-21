'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Camera, Eye, RefreshCw } from 'lucide-react';

type Props = {
  label: string;
  value: string | null;
  onChange: (val: string | null) => void;
  facingMode?: 'user' | 'environment';
  /** target aspect ratio for the snapshot (defaults to 3/4) */
  aspect?: number;
};

type VideoDevice = { deviceId: string; label: string };

export default function PhotoCapture({
  label,
  value,
  onChange,
  facingMode = 'environment',
  aspect = 3 / 4,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<'auto' | string>('auto');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSecure = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
  }, []);

  // ----- helpers -----
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const attachStream = useCallback(async (s: MediaStream) => {
    setStream(s);
    const track = s.getVideoTracks()[0];
    console.info('[PhotoCapture] using track:', {
      label: track?.label,
      settings: track?.getSettings?.(),
    });

    if (videoRef.current) {
      videoRef.current.srcObject = s;
      try {
        await videoRef.current.play();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const enumerate = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const cams = list
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || 'Camera' }));
      setDevices(cams);
      console.info('[PhotoCapture] video devices:', cams);
    } catch (e) {
      console.warn('[PhotoCapture] enumerateDevices failed:', e);
    }
  }, []);

  const getConstraints = useCallback((): MediaStreamConstraints => {
    const baseDims = { width: { ideal: 1280 }, height: { ideal: 960 } };
    if (selectedDeviceId !== 'auto') {
      return { video: { ...baseDims, deviceId: { exact: selectedDeviceId } }, audio: false };
    }
    return { video: { ...baseDims, facingMode: { ideal: facingMode } }, audio: false };
  }, [selectedDeviceId, facingMode]);

  // Try multiple fallbacks so laptops work reliably
  const startCamera = useCallback(async () => {
    setError(null);

    if (!isSecure) {
      setError('Camera requires HTTPS or http://localhost.');
      return;
    }

    // stop any existing
    stopCamera();

    const tryList: MediaStreamConstraints[] = [
      getConstraints(),                    // facingMode or deviceId
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }, // plain 720p
      { video: true, audio: false },       // last resort
    ];

    for (const c of tryList) {
      try {
        console.info('[PhotoCapture] trying constraints:', c);
        const s = await navigator.mediaDevices.getUserMedia(c);
        await attachStream(s);
        await enumerate(); // labels appear only after permission
        setError(null);
        return;
      } catch (err: any) {
        console.warn('[PhotoCapture] getUserMedia failed:', err?.name, err?.message);
        setError(err?.message || String(err));
      }
    }

    setError(
      'Unable to start the camera. Check browser permissions (lock icon → Site settings) and try again.'
    );
  }, [attachStream, enumerate, getConstraints, isSecure, stopCamera]);

  const closeOverlay = useCallback(() => {
    stopCamera();
    setOpen(false);
  }, [stopCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const v = videoRef.current;
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const vw = v.videoWidth;
    const vh = v.videoHeight;
    if (!vw || !vh) {
      setError('No video frames available. Try switching camera or allow permissions.');
      return;
    }

    // center-crop to target aspect
    const videoAspect = vw / vh;
    let sx = 0, sy = 0, sw = vw, sh = vh;

    if (videoAspect > aspect) {
      sw = Math.round(vh * aspect);
      sx = Math.round((vw - sw) / 2);
    } else {
      sh = Math.round(vw / aspect);
      sy = Math.round((vh - sh) / 2);
    }

    c.width = sw;
    c.height = sh;

    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = c.toDataURL('image/jpeg', 0.92);

    onChange(dataUrl);
    closeOverlay();
  }, [aspect, closeOverlay, onChange]);

  // File upload fallback (mobile/desktop)
  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      // draw to canvas to honor the same aspect crop
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      if (!ctx) return;

      const iw = img.width, ih = img.height;
      const imageAspect = iw / ih;
      let sx = 0, sy = 0, sw = iw, sh = ih;

      if (imageAspect > aspect) {
        sw = Math.round(ih * aspect);
        sx = Math.round((iw - sw) / 2);
      } else {
        sh = Math.round(iw / aspect);
        sy = Math.round((ih - sh) / 2);
      }

      c.width = sw; c.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = c.toDataURL('image/jpeg', 0.92);
      onChange(dataUrl);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [aspect, onChange]);

  useEffect(() => {
    return () => stopCamera(); // cleanup
  }, [stopCamera]);

  const openAndStart = () => {
    setOpen(true);
    setTimeout(() => startCamera(), 20); // ensure overlay is in DOM
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{label}</div>
        <Badge variant="outline">{facingMode === 'user' ? 'Front' : 'Rear'}</Badge>
      </div>

      {/* Tile */}
      {!value ? (
        <div className="rounded border border-dashed bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Button onClick={openAndStart} className="bg-green-600 hover:bg-green-700">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="max-w-[260px]"
            />
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>
      ) : (
        <div>
          <img
            src={value}
            alt={`${label} preview`}
            className="w-full aspect-[3/2] object-cover rounded border"
          />
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(value, '_blank')}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm" onClick={openAndStart}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retake
            </Button>
            <Button variant="outline" size="sm" onClick={() => onChange(null)}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-md bg-white shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedDeviceId === 'auto'
                  ? `Auto (${facingMode === 'user' ? 'front' : 'rear'})`
                  : 'Selected camera'}
              </div>

              {/* Device picker (appears after permission) */}
              {devices.length > 0 && (
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value as any)}
                >
                  <option value="auto">Auto (front/rear)</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : (
              <div className="relative rounded overflow-hidden bg-black min-h-[240px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{
                    transform:
                      selectedDeviceId === 'auto' && facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={closeOverlay}>
                Cancel
              </Button>
              <Button onClick={startCamera} variant="outline">
                Restart
              </Button>
              <Button onClick={capture} disabled={!stream || !!error}>
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
