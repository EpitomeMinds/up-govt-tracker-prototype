"use client";

import dynamic from "next/dynamic";

const UPCityMap = dynamic(() => import("./UPCityMap"), {
  ssr: false,
  loading: () => (
    <div className="map-split card flex h-[340px] items-center justify-center overflow-hidden text-slate-400">
      <div className="text-center">
        <p className="text-2xl">🗺</p>
        <p className="mt-2 text-sm">Loading Uttar Pradesh map…</p>
      </div>
    </div>
  ),
});

export default UPCityMap;
