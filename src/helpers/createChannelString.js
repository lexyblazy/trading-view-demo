export const createChannelString = (symbolInfo) => {
  let [exchange, from, to] = symbolInfo.name.split(/[:/]/);
  exchange = exchange === "GDAX" ? "Coinbase" : exchange;
  return `0~${exchange}~${from}~${to}`;
};
