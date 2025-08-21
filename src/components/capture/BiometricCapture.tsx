'use client';

import * as React from 'react';
import PhotoCapture from './PhotoCapture';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Props = {
  /** Optional initial photos (data URLs) */
  front?: string | null;
  side?: string | null;
  /**
   * Called whenever either image changes.
   * You’ll receive data URLs (or null) for each side.
   */
  onChange?: (patch: { front?: string | null; side?: string | null }) => void;
  /** Shown in the header (optional) */
  title?: string;
};

export default function BiometricCapture({
  front = null,
  side = null,
  onChange,
  title = 'Biometric Data Collection',
}: Props) {
  const [frontPhoto, setFrontPhoto] = React.useState<string | null>(front);
  const [sidePhoto, setSidePhoto] = React.useState<string | null>(side);

  // Bubble changes upwards
  React.useEffect(() => {
    onChange?.({ front: frontPhoto, side: sidePhoto });
  }, [frontPhoto, sidePhoto, onChange]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline">Mugshots</Badge>
        </CardTitle>
        <div className="flex gap-2">
          {frontPhoto && <Badge variant="secondary">Front Saved</Badge>}
          {sidePhoto && <Badge variant="secondary">Side Saved</Badge>}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* FRONT VIEW */}
          <div className="space-y-2">
            <div className="max-w-[360px]">
              <PhotoCapture
                label="Front View"
                value={frontPhoto}
                onChange={setFrontPhoto}
                facingMode="environment"
                aspect={3 / 4}
              />
            </div>

            {/* Tiny inline preview (optional) */}
            {frontPhoto && (
              <div className="mt-2">
                <img
                  src={frontPhoto}
                  alt="Front view mugshot"
                  className="h-40 w-auto rounded border object-cover"
                />
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => setFrontPhoto(null)}>
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* SIDE PROFILE */}
          <div className="space-y-2">
            <div className="max-w-[360px]">
              <PhotoCapture
                label="Side Profile"
                value={sidePhoto}
                onChange={setSidePhoto}
                facingMode="environment"
                aspect={3 / 4}
              />
            </div>

            {sidePhoto && (
              <div className="mt-2">
                <img
                  src={sidePhoto}
                  alt="Side profile mugshot"
                  className="h-40 w-auto rounded border object-cover"
                />
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => setSidePhoto(null)}>
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
