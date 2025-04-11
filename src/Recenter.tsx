import { useEffect } from "react";
import { useMap } from "react-leaflet";

const Recenter = ({ lat, lng, autoCenter }: any) => {
  const map = useMap();
  useEffect(() => {
    if (autoCenter) {
      map.setView([lat, lng]);
    }
  }, [lat, lng]);
  return null;
};

export default Recenter;
