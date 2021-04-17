(function () {
  let extensionConfig = {
    showScheduleOnPopup: false,
    effectiveTransferType: "eom",
    restrictTorrentSpeed: false,
    transmissionSpeedMargin: 50,
    transmissionSpeedMarginType: "percent",
    transmissionAuthorizationUsername: "myUser",
    transmissionAuthorizationPassword: "myPassword",
    monthlyReserveGigabytes: 0,
  };

  function writeLocalConfig() {
    browser.storage.local.set({ config: extensionConfig });
  }

  function readLocalConfig() {
    function processConfig(readConfig) {
      let configSubObject = readConfig.config;
      if (configSubObject) {
        extensionConfig = configSubObject;
      }

      let monthlyReserveInput = document.getElementById("monthly-reserve-in-gb");
      monthlyReserveInput.value = extensionConfig.monthlyReserveGigabytes;

      let scheduleSwitch = document.getElementById("schedule-switch");
      if (extensionConfig.showScheduleOnPopup) {
        scheduleSwitch.checked = true;
      } else {
        scheduleSwitch.checked = false;
      }

      let speedTypeSelector = document.getElementById("transfer-rate-select");
      for (option of speedTypeSelector.options) {
        if (option.value == extensionConfig.effectiveTransferType) {
          option.selected = true;
        }
      }

      let transmissionSwitch = document.getElementById("transmission-switch");
      if (extensionConfig.restrictTorrentSpeed) {
        transmissionSwitch.checked = true;
      } else {
        transmissionSwitch.checked = false;
      }

      let transmissionSpeedMarginInput = document.getElementById("transmission-speed-margin");
      transmissionSpeedMarginInput.value = extensionConfig.transmissionSpeedMargin;

      let transmissionSpeedMarginTypeSelector = document.getElementById("transmission-speed-margin-type");
      for (option of transmissionSpeedMarginTypeSelector.options) {
        if (option.value == extensionConfig.transmissionSpeedMarginType) {
          option.selected = true;
        }
      }

      let transmissionUserInput = document.getElementById("transmission-user");
      transmissionUserInput.value =
        extensionConfig.transmissionAuthorizationUsername;

      let transmissionPasswordInput = document.getElementById(
        "transmission-password"
      );
      transmissionPasswordInput.value =
        extensionConfig.transmissionAuthorizationPassword;

      writeLocalConfig();
    }
    browser.storage.local.get("config").then(processConfig);
  }

  function registerEvents() {
    // that's gonna need refactorization soon
    function flipScheduleSwitch(event) {
      let eventTarget = event.target;
      extensionConfig.showScheduleOnPopup = eventTarget.checked;
      writeLocalConfig();
    }
    let scheduleSwitch = document.getElementById("schedule-switch");
    scheduleSwitch.addEventListener("change", flipScheduleSwitch);

    function changeMonthlyReserve(event) {
      let eventTarget = event.target;
      extensionConfig.monthlyReserveGigabytes = parseInt(eventTarget.value);
      writeLocalConfig();
    }
    let monthlyReserveInput = document.getElementById("monthly-reserve-in-gb");
    monthlyReserveInput.addEventListener("change", changeMonthlyReserve);

    function changeSpeedCalculatingAlgorithm(event) {
      let eventTarget = event.target;
      extensionConfig.effectiveTransferType = eventTarget.value;
      writeLocalConfig();
    }
    let speedTypeSelector = document.getElementById("transfer-rate-select");
    speedTypeSelector.addEventListener(
      "change",
      changeSpeedCalculatingAlgorithm
    );

    function flipTransmissionSwitch(event) {
      let eventTarget = event.target;
      extensionConfig.restrictTorrentSpeed = eventTarget.checked;
      writeLocalConfig();
    }
    let transmissionSwitch = document.getElementById("transmission-switch");
    transmissionSwitch.addEventListener("change", flipTransmissionSwitch);


    function changeTransmissionSpeedMargin(event) {
      let eventTarget = event.target;
      extensionConfig.transmissionSpeedMargin = parseInt(eventTarget.value);
      writeLocalConfig();
    }
    let transmissionSpeedMarginInput = document.getElementById("transmission-speed-margin");
    transmissionSpeedMarginInput.addEventListener("change", changeTransmissionSpeedMargin);

    function changeTransmissionSpeedMarginType(event) {
      let eventTarget = event.target;
      extensionConfig.transmissionSpeedMarginType = eventTarget.value;
      writeLocalConfig();
    }
    let transmissionSpeedMarginTypeSelector = document.getElementById("transmission-speed-margin-type");
    transmissionSpeedMarginTypeSelector.addEventListener("change", changeTransmissionSpeedMarginType);

    function changeTransmissionUser(event) {
      let eventTarget = event.target;
      extensionConfig.transmissionAuthorizationUsername = eventTarget.value;
      writeLocalConfig();
    }
    let transmissionUserInput = document.getElementById("transmission-user");
    transmissionUserInput.addEventListener("keyup", changeTransmissionUser);

    function changeTransmissionPassword(event) {
      let eventTarget = event.target;
      extensionConfig.transmissionAuthorizationPassword = eventTarget.value;
      writeLocalConfig();
    }
    let transmissionPasswordInput = document.getElementById(
      "transmission-password"
    );
    transmissionPasswordInput.addEventListener(
      "keyup",
      changeTransmissionPassword
    );
  }
  readLocalConfig();
  registerEvents();
  setInterval(writeLocalConfig, 5000);
})();
