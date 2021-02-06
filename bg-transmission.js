(function () {
  // TODO: Make me configurable like one of your french scripts
  let transmissionControlEnabled = true;
  let transmissionHost = "transmission-host";
  // C:\Windows\System32\drivers\etc\hosts
  // /etc/hosts
  let transmissionHostPort = 9091;
  let freeTransferBufferWindow = 50;

  let transmissionSessionIdHeader = "X-Transmission-Session-Id";
  let transmissionSessionIdValue = "We'll find out";
  // let authorizationUsername = "mylogin";
  // let authorizationPassword = "mypassword";

  function adjustTransmissionDownloadSpeed(speed) {
    if (transmissionControlEnabled) {
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
          } else if (response.status == 200) {
            //thx, bye
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
        "Basic " + btoa(authorizationUsername + ":" + authorizationPassword)
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
  }

  function makeFullTransmissionSessionConfigCalibrationRun() {
    function runAsync(dataSavedInLocalStorage) {
      let config = dataSavedInLocalStorage.data;
      let topSpeed = config.steadyTransferToEndOfMonthInKbps;
      if (topSpeed && (topSpeed > freeTransferBufferWindow)) {
        topSpeed -= freeTransferBufferWindow;
      } else {
        topSpeed = 1;
      }
      adjustTransmissionDownloadSpeed(topSpeed);
    }
    browser.storage.local.get("data").then(runAsync);
  }

  function transmissionModuleRunner() {
    // makeFullTransmissionSessionConfigCalibrationRun();
    setInterval(makeFullTransmissionSessionConfigCalibrationRun, 30000);
  }
  transmissionModuleRunner();
})();
