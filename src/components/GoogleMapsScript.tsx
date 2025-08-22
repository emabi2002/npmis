'use client';
import Script from 'next/script';

export default function GoogleMapsScript({
  onLoad,
}: { onLoad?: () => void }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  return (
    <Script
      id="gmaps-js"
      src={`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`}
      strategy="afterInteractive"
      onLoad={onLoad}
    />
  );
}
