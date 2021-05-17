import { createChannelString } from "./createChannelString";
import * as historyProvider from "./historyProvider";

const CRYPTO_COMAPRE_SOCKET_URL = `wss://streamer.cryptocompare.com/v2`;
const socketUrl = `${CRYPTO_COMAPRE_SOCKET_URL}?api_key=${process.env.REACT_APP_CRYPTO_COMPARE_API_KEY}`;
const subs = [];

const stream = new WebSocket(socketUrl);

export const subscribeBars = (
  symbolInfo,
  resolution,
  updateCb,
  uid,
  resetCache
) => {
  const channelString = createChannelString(symbolInfo);

  stream.addEventListener("open", () => {
    console.log("stream Opened");
    const addSubMessage = {
      action: "SubAdd",
      subs: [channelString],
    };

    stream.send(JSON.stringify(addSubMessage));
  });

  stream.addEventListener("message", (message) => {
    processWebSocketMessage(message);
  });

  stream.addEventListener("close", () => {
    console.log("stream closed");
  });

  const newSub = {
    channelString,
    uid,
    resolution,
    symbolInfo,
    lastBar: historyProvider.history[symbolInfo.name].lastBar,
    listener: updateCb,
  };

  subs.push(newSub);
};

export const unsubscribeBars = (uid) => {
  const subIndex = subs.findIndex((e) => e.uid === uid);

  if (subIndex === -1) {
    return;
  }

  const sub = subs[subIndex];

  if (stream.readyState === 1) {
    // only remove when stream is connected
    const removeSubMessage = {
      action: "SubRemove",
      subs: [sub.channelString],
    };
    subs.splice(subIndex, 1);
    stream.send(JSON.stringify(removeSubMessage));
  }
};

const processWebSocketMessage = (message) => {
  const streamData = JSON.parse(message.data);

  const { TYPE, M, FSYM, TSYM, P, TOTAL, TS, ID } = streamData;

  const data = {
    subType: TYPE,
    exchange: M,
    tosym: TSYM,
    fsym: FSYM,
    trade_id: ID,
    ts: TS,
    volume: TOTAL,
    price: P,
  };

  const channelString = `${data.subType}~${data.exchange}~${data.fsym}~${data.tosym}`;

  const sub = subs.find((e) => e.channelString === channelString);

  if (sub) {
    // disregard the initial catchup snapshot of trades for already closed candles
    if (data.ts < sub.lastBar.time / 1000) {
      return;
    }

    console.log("new stream, updating....");
    const updatedBar = getUpdatedBar(data, sub);
    sub.listener(updatedBar);
    sub.lastBar = updatedBar;
  }
};

const getUpdatedBar = (data, sub) => {
  const lastBar = sub.lastBar;
  let resolution = sub.resolution;

  if (resolution.includes("D")) {
    // 1 day in minutes === 1440
    resolution = 1440;
  } else if (resolution.includes("W")) {
    // 1 week in minutes === 10080
    resolution = 10080;
  }
  const coeff = resolution * 60;
  // console.log({coeff})
  const rounded = Math.floor(data.ts / coeff) * coeff;
  const lastBarSec = lastBar.time / 1000;

  let updatedLastBar;

  if (rounded > lastBarSec) {
    updatedLastBar = {
      time: rounded * 1000,
      open: lastBar.close,
      high: lastBar.close,
      low: lastBar.close,
      close: data.price,
      volume: data.volume,
    };
  } else {
    if (data.price < lastBar.low) {
      lastBar.low = data.price;
    } else if (data.price > lastBar.high) {
      lastBar.high = data.price;
    }

    lastBar.volume += data.volume;
    lastBar.close = data.price;
    updatedLastBar = lastBar;
  }
  return updatedLastBar;
};
