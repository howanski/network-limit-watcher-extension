(function () {
  let extensionConfig = {
    restrictTorrentSpeed: false,
    restrictOnlyTurtleMode: false,
    showScheduleOnPopup: false,
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

      let transmissionSwitch = document.getElementById("transmission-switch");
      if (extensionConfig.restrictTorrentSpeed) {
        transmissionSwitch.checked = true;
      } else {
        transmissionSwitch.checked = false;
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

    function flipTransmissionSwitch(event) {
      let eventTarget = event.target;
      extensionConfig.restrictTorrentSpeed = eventTarget.checked;
      writeLocalConfig();
    }
    let transmissionSwitch = document.getElementById("transmission-switch");
    transmissionSwitch.addEventListener("change", flipTransmissionSwitch);

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
    let transmissionPasswordInput = document.getElementById("transmission-password");
    transmissionPasswordInput.addEventListener("keyup", changeTransmissionPassword);
  }
  readLocalConfig();
  registerEvents();
  setInterval(writeLocalConfig, 5000);
})();
