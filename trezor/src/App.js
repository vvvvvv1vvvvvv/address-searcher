import { useEffect, useMemo, useRef, useState } from "react";
import HDKey from "hdkey";
import * as ethUtil from "ethereumjs-util";
import TrezorConnect from "@trezor/connect-web";

const HDPathType = {
  LedgerLive: "LedgerLive",
  Legacy: "Legacy",
  BIP44: "BIP44",
  SLIP0044TestnetPath: "SLIP0044TestnetPath",
};

const HD_PATH_BASE = {
  [HDPathType.BIP44]: "m/44'/60'/0'/0",
  [HDPathType.SLIP0044TestnetPath]: "m/44'/1'/0'/0",
  [HDPathType.Legacy]: "m/44'/60'/0'",
  [HDPathType.LedgerLive]: "m/44'/60'/0'/0/0",
};

function App() {
  const [ready, setReady] = useState(false);
  const [hdPath, setHDPath] = useState("m/44'/60'/0'/0");
  const [list, setList] = useState([]);
  const [basePub, setBasePub] = useState(null);
  const inited = useRef(false);
  const Trezor = useRef(TrezorConnect);

  const hdKey = useMemo(() => {
    if (basePub) {
      const hdk = new HDKey();
      hdk.publicKey = Buffer.from(basePub.publicKey, "hex");
      hdk.chainCode = Buffer.from(basePub.chainCode, "hex");
      return hdk;
    }
    return null;
  }, [basePub]);

  const isLedgerLiveHDPath = useMemo(() => {
    return hdPath === HD_PATH_BASE[HDPathType.LedgerLive];
  }, [hdPath]);

  const handleHDPathChange = (e) => {
    console.log(e);
    setBasePub(null);
    setHDPath(e.target.value);
  };

  const listLedgerLiveAddresses = async () => {
    for (let i = 0; i < 100; i++) {
      const res = await Trezor.current.ethereumGetAddress({
        showOnTrezor: false,
        path: `m/44'/60'/${i}'/0/0`,
      });
      console.log('res', res);
      setList((prev) => [
        ...prev,
        {
          index: i,
          pub: "",
          address: res.payload.address,
        },
      ]);
    }
  };

  const handleGetPublicKey = async () => {
    if (isLedgerLiveHDPath) {
      listLedgerLiveAddresses();
      return;
    }
    const res = await Trezor.current.getPublicKey({
      path: hdPath || `m/44'/60'/0'/0`,
      coin: "ETH",
    });
    console.log("res", res);
    setBasePub({
      publicKey: res.payload.publicKey,
      chainCode: res.payload.chainCode,
    });
  };

  useEffect(() => {
    if (hdKey) {
      const arr = [];
      for (let i = 0; i < 1000; i++) {
        const dkey = hdKey.derive(`m/${i}`);
        console.log("dkey", dkey);
        const pub = ethUtil.bufferToHex(dkey.publicKey);
        const address = ethUtil
          .publicToAddress(dkey.publicKey, true)
          .toString("hex");
        arr.push({
          index: i,
          pub,
          address,
        });
      }
      setList(arr);
      console.log("arr", arr);
    }
  }, [hdKey, hdPath]);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    Trezor.current = TrezorConnect;
    Trezor.current
      .init({
        manifest: {
          email: "developer@xyz.com",
          appUrl: "http://your.application.com",
        },
      })
      .then(() => {
        setReady(true);
      });
  }, []);

  return (
    <div className="App">
      <div>
        <select onChange={handleHDPathChange}>
          {Object.keys(HD_PATH_BASE).map((item) => (
            <option value={HD_PATH_BASE[item]}>{item}</option>
          ))}
        </select>
        <button onClick={handleGetPublicKey} disabled={!ready}>
          Get Addresses
        </button>
        {list.length > 0 && `${list.length} / ${isLedgerLiveHDPath ? 100 : 1000} addresses`}
        {list.length > 0 && <pre>{JSON.stringify(list, null, 2)}</pre>}
      </div>
    </div>
  );
}

export default App;
