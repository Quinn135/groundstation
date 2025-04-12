"use strict";
import { useState useEffect } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import Recenter from "./Recenter";

function App() {
  const [data, setData] = useState({
    alt: 0,
    lat: 0,
    lng: 0,
    mps: 0,
    time: 2411600, // HHMMSSCC
    sats: 0,
  });
  const [autoCenter, setAutoCenter] = useState(true);
  const [mapUrl, setMapUrl] = useState(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  );
  // http://services.arcgisonline.com/ArcGis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png

  useEffect(() => {
    var port = null;

    document
      .getElementById("connectButton")!
      .addEventListener("click", async () => {
        // @ts-ignore
        port = await navigator.serial.requestPort(); // Requests the port to connect to! (yes it works)

        try {
          await port.open({ baudRate: 115200 });
        } catch (err) {
          alert(err);
        } finally {
          console.log(port); // Debug

          if (port.connected) {
            // readable stream:
            const reader = await port.readable.getReader();
            var str = "";

            reader.read().then(function pump({ done, value }: any) {
              if (done) {
                return;
              }

              // Make sure we're not starting in the middle of a transfer
              if (
                (str == "" && String.fromCharCode(...value).startsWith("{")) ||
                str != ""
              ) {
                str += String.fromCharCode(...value);

                if (str.endsWith("\n")) {
                  // New Line, so read data
                  var JSONData = JSON.parse(str); // Should result in the JSON for it
                  console.log(JSONData);

                  setData(JSONData);

                  str = ""; // Reset so that the next line is it's own
                }
              }

              return reader.read().then(pump);
            });
          }
        }
        // https://developer.mozilla.org/en-US/docs/Web/API/SerialPort
      });
  }, []);

  return (
    <div className="flex flex-col" id="mainContainer">
      <MapContainer
        center={[data.lat, data.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="grow"
      >
        <TileLayer
          attribution={
            "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          }
          url={mapUrl}
        ></TileLayer>
        <Recenter
          lat={data.lat}
          lng={data.lng}
          autoCenter={autoCenter}
        ></Recenter>
        <Marker position={[data.lat, data.lng]}></Marker>
      </MapContainer>
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 p-2">
        <p className="bg-neutral-800 p-1 px-2.5 rounded">
          {data.alt.toFixed(2)}ft
        </p>
        <p className="bg-neutral-800 p-1 px-2.5 rounded">
          {data.mps.toFixed(2)}m/s
        </p>
        <p className="bg-neutral-800 p-1 px-2.5 rounded">
          {(data.mps * 2.236936).toFixed(2)}mph
        </p>
        <p className="bg-neutral-800 p-1 px-2.5 rounded">
          {` ${data.time.toString().slice(-8, -6)}:${data.time
            .toString()
            .slice(-6, -4)}:${data.time.toString().slice(-4, -2)} `}
          UTC (
          {`${
            Number(data.time.toString().slice(-8, -6)) - 5 < 0
              ? Number(data.time.toString().slice(-8, -6)) - 5 + 24
              : Number(data.time.toString().slice(-8, -6)) - 5
          }:${data.time.toString().slice(-6, -4)}:${data.time
            .toString()
            .slice(-4, -2)}`}{" "}
          our time)
        </p>
        <p className="bg-neutral-800 p-1 px-2.5 rounded">{data.sats} Sats</p>
        <button
          className="cursor-pointer bg-neutral-800 p-1 px-2.5 rounded active:bg-neutral-700"
          onClick={() => {
            if (
              mapUrl == "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ) {
              setMapUrl(
                "http://services.arcgisonline.com/ArcGis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png"
              );
            } else {
              setMapUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
            }
          }}
        >
          Layer
        </button>
        <label
          className="cursor-pointer bg-neutral-800 p-1 px-2.5 rounded active:bg-neutral-700"
          htmlFor="autoCenter"
        >
          Auto Center&nbsp;
          <input
            type="checkbox"
            name="Auto Center"
            id="autoCenter"
            className="cursor-pointer"
            onChange={(e) => {
              setAutoCenter(e.target.checked);
            }}
            defaultChecked
          />
        </label>
        <button
          id={"connectButton"}
          className="cursor-pointer bg-neutral-800 p-1 px-2.5 rounded active:bg-neutral-700"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

export default App;
