(function () {
  let extensionConfig = {
    showScheduleOnPopup: false,
    effectiveTransferType: "eom",
    restrictTorrentSpeed: false,
    transmissionSpeedMargin: 50,
    transmissionAuthorizationUsername: "myUser",
    transmissionAuthorizationPassword: "myPassword",
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
