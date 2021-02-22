(function () {
  let extensionConfig = {};

  let transmissionHost = "transmission-host";
  let transmissionHostPort = 9091;
  let freeTransferBufferWindow = 50;

  let transmissionSessionIdHeader = "X-Transmission-Session-Id";
  let transmissionSessionIdValue = "We'll find out";

  function adjustTransmissionDownloadSpeed(speed) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
      let response = this;
      if (response.readyState == 4) {
        if (response.status == 409) {
          //Confilct - bad header, get correct and run again
          transmissionSessionIdValue = response.getResponseHeader(
            transmissionSessionIdHeader
          );
          adjustTransmissionDownloadSpeed(speed);
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
        "alt-speed-down": speed,
        "speed-limit-down": speed,
      },
    };
    httpRequest.send(JSON.stringify(message));
  }

  function makeFullTransmissionSessionConfigCalibrationRun(extConfig) {
    extensionConfig = extConfig.config;
    if (extensionConfig) {
      function runAsync(dataSavedInLocalStorage) {
        let data = dataSavedInLocalStorage.data;
        let topSpeed = data.steadyTransferToEndOfMonthInKbps;
        if (extensionConfig.effectiveTransferType == "eod") {
          topSpeed = data.steadyTransferToEndOfDayInKbps;
        }
        if (topSpeed && topSpeed > freeTransferBufferWindow) {
          topSpeed -= freeTransferBufferWindow;
        } else {
          topSpeed = 1;
        }
        adjustTransmissionDownloadSpeed(topSpeed);
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
