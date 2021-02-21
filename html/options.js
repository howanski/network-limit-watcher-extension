(function () {
  let extensionConfig = {
    restrictTorrentSpeed: false,
    restrictOnlyTurtleMode: false,
    showScheduleOnPopup: true,
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
      writeLocalConfig();
    }
    browser.storage.local.get("config").then(processConfig);
  }

  function registerEvents() {
    function flipScheduleSwitch(event) {
      let eventTarget = event.target;
      extensionConfig.showScheduleOnPopup = eventTarget.checked;
      writeLocalConfig();
    }
    let scheduleSwitch = document.getElementById("schedule-switch");
    scheduleSwitch.addEventListener("change", flipScheduleSwitch);
  }
  readLocalConfig();
  registerEvents();
})();
