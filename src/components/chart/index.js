import React from "react";
import * as helpers from "../../helpers";
import "./index.css";

export class Chart extends React.Component {
  static defaultProps = {
    symbol: "Coinbase:BTC/USD",
    interval: "15",
    containerId: "tv_chart_container",
    libraryPath: "/charting_library/",
    chartsStorageUrl: "https://saveload.tradingview.com",
    chartsStorageApiVersion: "1.1",
    clientId: "tradingview.com",
    userId: "public_user_id",
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
  };

  async componentDidMount() {
    const datafeed = await helpers.getDataFeed();

    const widgetOptions = {
      debug: false,
      symbol: "Coinbase:BTC/USD",
      datafeed, // our datafeed object
      interval: "15",
      container_id: "tv_chart_container",
      library_path: "/charting_library/",
      locale: helpers.getLanguageFromURL() || "en",
      disabled_features: ["use_localstorage_for_settings"],
      enabled_features: [],
      client_id: "test",
      user_id: "public_user_id",
      fullscreen: false,
      autosize: true,
      overrides: {
        "paneProperties.background": "#131722",
        "paneProperties.vertGridProperties.color": "#363c4e",
        "paneProperties.horzGridProperties.color": "#363c4e",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#AAA",
        "mainSeriesProperties.candleStyle.wickUpColor": "#336854",
        "mainSeriesProperties.candleStyle.wickDownColor": "#7f323f",
        "mainSeriesProperties.showCountdown": true,
      },
    };

    const widget = (window.tvWidget = new window.TradingView.widget(
      widgetOptions
    ));

    widget.onChartReady(() => {
      console.log("Chart has loaded!");
    });
  }

  render() {
    return <div id={this.props.containerId} className={"TVChartContainer"} />;
  }
}
