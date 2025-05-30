"use strict";
import { useState, useEffect } from "react";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { Icon } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import Recenter from "./Recenter";

function App() {
  const [data, setData] = useState({
    alt: 0,
    lat: 0,
    lng: 0,
    mps: 0,
    time: 0, // HHMMSSCC
    sats: 0,
    rssi: -999,
  });
  const [autoCenter, setAutoCenter] = useState(true);
  const [mapUrl, setMapUrl] = useState(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  );
  // http://services.arcgisonline.com/ArcGis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png

  useEffect(() => {
    var port = null;
    var JSONData = {
      alt: -1,
      lat: -1,
      lng: -1,
      mps: -1,
      time: -1, // HHMMSSCC
      sats: -1,
      rssi: -1,
    };

    document
      .getElementById("connectButton")!
      .addEventListener("click", async () => {
        var high = false;
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
                  JSONData = {
                    alt: -1,
                    lat: -1,
                    lng: -1,
                    mps: -1,
                    time: -1, // HHMMSSCC
                    sats: -1,
                    rssi: -1,
                  };

                  try {
                    JSONData = JSON.parse(str); // Should result in the JSON for it
                    console.log(JSONData);

                    setData({
                      alt: Number(JSONData.alt),
                      lat: Number(JSONData.lat),
                      lng: Number(JSONData.lng),
                      mps: Number(JSONData.mps),
                      time: Number(JSONData.time), // HHMMSSCC
                      sats: Number(JSONData.sats),
                      rssi: Number(JSONData.rssi),
                    });
                  } catch (error) {
                    console.log(error);

                    document.getElementById(
                      "updateCircle"
                    )!.style.backgroundColor = "hsl(0, 100%, 50%)";
                  }

                  // Make the update circle turn red temporarily

                  if (high) {
                    document.getElementById(
                      "updateCircle"
                    )!.style.backgroundColor = "oklch(62.3% 0.214 259.815)";
                  } else {
                    document.getElementById(
                      "updateCircle"
                    )!.style.backgroundColor = "hsl(57, 100%, 50%)";
                  }
                  high = !high;

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
        zoom={15}
        maxZoom={21}
        scrollWheelZoom={true}
        className="grow"
      >
        <TileLayer
          attribution={
            "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          }
          maxNativeZoom={18}
          maxZoom={22}
          url={mapUrl}
        ></TileLayer>
        <Recenter
          lat={data.lat}
          lng={data.lng}
          autoCenter={autoCenter}
        ></Recenter>
        <Marker
          position={[data.lat, data.lng]}
          icon={
            new Icon({
              iconUrl: markerIconPng,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          }
        ></Marker>
      </MapContainer>
      <div className="flex flex-row flex-wrap justify-between">
        <div className="flex flex-row flex-wrap items-center justify-start gap-3 p-2">
          <p className="bg-neutral-800 p-1 px-2.5 rounded">
            {data.alt.toFixed(2)}m
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
          <p className="bg-neutral-800 p-1 px-2.5 rounded">
            {data.rssi}dB RSSI
          </p>
          <p
            className="bg-neutral-800 p-1 px-2.5 rounded"
            style={{ background: data.sats == 0 ? "red" : "oklch(26.9% 0 0)" }}
          >
            {data.sats} Sats
          </p>
          <p className="bg-neutral-800 p-1 px-2.5 rounded">Lat: {data.lat}</p>
          <p className="bg-neutral-800 p-1 px-2.5 rounded">Lng: {data.lng}</p>
          <div
            id="updateCircle"
            className="h-7 w-7 rounded-full border-neutral-700 border-4"
            style={{ backgroundColor: "oklch(62.3% 0.214 259.815)" }}
          ></div>
        </div>
        <div className="flex flex-row flex-wrap items-center justify-start gap-3 p-2">
          <a
            className="cursor-pointer bg-neutral-800 p-1 px-2.5 rounded active:bg-neutral-700"
            target="_blank"
            rel="noopener noreferrer"
            href={"https://maps.google.com/?q=" + data.lat + "," + data.lng}
          >
            <div className="flex flex-row flex-nowrap items-center">
              <img
                src="/google-maps.png"
                alt="Google Maps"
                className="h-5 pr-1.5"
              />
              <p>Maps</p>
            </div>
          </a>
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
    </div>
  );
}

export default App;
