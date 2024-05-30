import * as bip39 from "@scure/bip39";
import { HDKey } from "ethereum-cryptography/hdkey";
import * as sigUtil from "eth-sig-util";
import { bytesToHex, publicToAddress, privateToPublic } from "@ethereumjs/util";

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

const mnemonic =
  "follow ice inform satoshi special palm comic next bus element congress nose"; // input your mnemonic here
const targetAddress = "0x162fdF3500b513cfc55D950749AE28A7C091cD2F"; // input the address you want to find here
const passphrase = '' // input your passphrase here


const MAX_INDEX = 1000;
let publicKey = "";
let hdWallet = null;

const getHDPathBase = (hdPathType) => {
  return HD_PATH_BASE[hdPathType];
};

const calcBasePublicKey = (hdKey) => {
  return bytesToHex(hdKey.derive(getHDPathBase(HDPathType.BIP44)).publicKey);
};

const initFromMnemonic = (mnemonic, passphrase) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  hdWallet = HDKey.fromMasterSeed(seed);
  publicKey = calcBasePublicKey(hdWallet);
};

const isLedgerLiveHdPath = () => {
  return global.hdPath === HD_PATH_BASE[HDPathType.LedgerLive];
};

const getPathForIndex = (index) => {
  return isLedgerLiveHdPath()
    ? `m/44'/60'/${index}'/0/0`
    : `${global.hdPath}/${index}`;
};

const getChildForIndex = (index) => {
  return hdWallet.derive(getPathForIndex(index));
};

const _addressFromPublicKey = (publicKey) => {
  return bytesToHex(publicToAddress(publicKey, true)).toLowerCase();
};

const _addressFromIndex = (i) => {
  const child = getChildForIndex(i);
  const wallet = {
    publicKey: privateToPublic(child.privateKey),
    privateKey: child.privateKey,
  };
  const address = sigUtil.normalize(_addressFromPublicKey(wallet.publicKey));

  return [address, wallet];
};

const getAddresses = (start, end) => {
  const from = start;
  const to = end;
  const accounts = [];
  for (let i = from; i < to; i++) {
    const [address, wallet] = _addressFromIndex(i);
    accounts.push({
      address: address.toLowerCase(),
      index: i + 1,
      pk: wallet.privateKey,
    });
  }
  return accounts;
};

(() => {
  const keys = Object.keys(HD_PATH_BASE);
  keys.forEach((key) => {
    global.hdPath = HD_PATH_BASE[key];
    initFromMnemonic(mnemonic, passphrase);
    const list = getAddresses(0, MAX_INDEX);
    const target = list.find(
      (item) => item.address === targetAddress.toLowerCase()
    );
    if (target) {
      console.log(`>>>>> address ${targetAddress} found`);
      console.log(`>>>>> private key: ${bytesToHex(target.pk)}`);
    }
  });
  console.log(">>>> finished");
})();
