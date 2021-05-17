import axios from "axios";

// const dataSources = ["cryptoCompare", "binance"];

export const history = {};

export const getHistoricalData = async (
  { symbolInfo, resolution, from, to, firstDataRequest, limit },
  source = "cryptoCompare"
) => {
  let data = [];
  if (source === "cryptoCompare") {
    data = await getHistorialDataFromCryptoCompare({
      symbolInfo,
      resolution,
      to,
      limit,
    });
  }

  const bars = transformHistoricalDataToBars(data, firstDataRequest);

  if (firstDataRequest) {
    const lastBar = bars[bars.length - 1];
    history[symbolInfo.name] = { lastBar };
  }

  return bars;
};

const getHistorialDataFromCryptoCompare = async ({
  symbolInfo,
  resolution,
  to,
  limit,
}) => {
  const LOG_PREFIX = "getHistorialDataFromCryptoCompare: ";

  const BASE_API_URL = "https://min-api.cryptocompare.com";

  const [exchange, fromSymbol, toSymbol] = symbolInfo.name.split(/[:/]/);

  const url =
    resolution === "D"
      ? "/data/histoday"
      : resolution >= 60
      ? "/data/histohour"
      : "/data/histominute";

  const params = {
    e: exchange,
    fsym: fromSymbol,
    tsym: toSymbol,
    toTs: to ? to : "",
    limit: limit ? limit : 2000,
    // aggregate: 1 //resolution
  };

  const API_URL = `${BASE_API_URL}${url}`;

  const response = await axios.get(API_URL, { params });

  const { data } = response;

  if (!data) {
    return null;
  }

  if (data.Response && data.Response === "Error") {
    console.log(LOG_PREFIX, "API error:", data.Message);

    return [];
  }

  return data.Data;
};

const transformHistoricalDataToBars = (dataEntry, firstDataRequest) => {
  if (!dataEntry) return null;

  const bars = dataEntry.map((entry) => {
    return {
      time: entry.time * 1000,
      low: entry.low,
      high: entry.high,
      open: entry.open,
      close: entry.close,
      volume: entry.volumefrom,
    };
  });

  return bars;
};
