(function () {
  let extensionConfig = {};

  let transmissionHost = "transmission-host";
  let transmissionHostPort = 9091;

  let transmissionSessionIdHeader = "X-Transmission-Session-Id";
  let transmissionSessionIdValue = "We'll find out";

  function adjustTransmissionDownloadSpeed(topSpeed, lowerSpeed) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      let response = this;
      if (response.readyState == 4) {
        if (response.status == 409) {
          //Confilct - bad header, get correct and run again
          transmissionSessionIdValue = response.getResponseHeader(
            transmissionSessionIdHeader
          );
          adjustTransmissionDownloadSpeed(topSpeed, lowerSpeed);
        }
      }
    };

    httpRequest.open(
      "POST",
      "http://" +
      transmissionHost +
      ":" +
      transmissionHostPort +
      "/transmission/rpc",
      true
    );
    httpRequest.setRequestHeader(
      "Authorization",
      "Basic " +
      btoa(
        extensionConfig.transmissionAuthorizationUsername +
        ":" +
        extensionConfig.transmissionAuthorizationPassword
      )
    );
    httpRequest.setRequestHeader(
      transmissionSessionIdHeader,
      transmissionSessionIdValue
    );
    httpRequest.setRequestHeader("Content-Type", "application/json");

    httpRequest.overrideMimeType("application/json");
    let message = {
      method: "session-set",
      arguments: {
        "alt-speed-down": lowerSpeed,
        "speed-limit-down": topSpeed,
      },
    };
    httpRequest.send(JSON.stringify(message));
  }

  function makeFullTransmissionSessionConfigCalibrationRun(extConfig) {
    extensionConfig = extConfig.config;
    if (extensionConfig) {
      function runAsync(dataSavedInLocalStorage) {
        let data = dataSavedInLocalStorage.data;
        let lowerSpeed = data.steadyTransferToEndOfMonthInKbps;

        if (extensionConfig.effectiveTransferType == "eod") {
          lowerSpeed = data.steadyTransferToEndOfDayInKbps;
        }

        let topSpeed = lowerSpeed;
        if (extensionConfig.transmissionSpeedMarginType == "percent") {
          lowerSpeed *= extensionConfig.transmissionSpeedMargin;
          lowerSpeed /= 100;
          lowerSpeed = parseInt(lowerSpeed);
        } else if (extensionConfig.transmissionSpeedMarginType == "ave-herd") { //average herding
          let agression = extensionConfig.transmissionSpeedMargin;
          if (agression < 2) {
            agression = 2;
          }
          lowerSpeed = (topSpeed - data.normalMonthlyTransfer) * agression + data.normalMonthlyTransfer;
        } else if (extensionConfig.transmissionSpeedMarginType == "man-herd") { //manual herding
          lowerSpeed = (topSpeed - extensionConfig.transmissionSpeedMargin) * 2 + extensionConfig.transmissionSpeedMargin;
        } else if (extensionConfig.transmissionSpeedMarginType == "man-herd-5") { //manual herding x5
          lowerSpeed = (topSpeed - extensionConfig.transmissionSpeedMargin) * 5 + extensionConfig.transmissionSpeedMargin;
        } else { // "kbps"
          lowerSpeed -= extensionConfig.transmissionSpeedMargin;
        }

        if (topSpeed < 5) {
          topSpeed = 5;
        }

        if (lowerSpeed < 5) {
          lowerSpeed = 5;
        }
        adjustTransmissionDownloadSpeed(topSpeed, lowerSpeed);
      }

      if (extensionConfig.restrictTorrentSpeed) {
        browser.storage.local.get("data").then(runAsync);
      }
    }
  }

  function refreshExtensionSettingsAndRun() {
    browser.storage.local
      .get("config")
      .then(makeFullTransmissionSessionConfigCalibrationRun);
  }

  function transmissionModuleRunner() {
    setInterval(refreshExtensionSettingsAndRun, 30000);
  }

  transmissionModuleRunner();
})();
