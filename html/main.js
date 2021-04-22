(function () {
  let mainInfo = {
    currentMonthMovementInBytes: 0,
    monthlyDataCapInBytes: 0,
    startOfMonthDay: 1,
    bytesLeftThisMonth: 0,
    bytesLeftToday: 0,
    dailyDataCapInBytes: 0,
    milisecondsLeftThisMonth: 0,
    steadyTransferToEndOfMonthInKbps: 0,
    steadyTransferToEndOfDayInKbps: 0,
    healthySchedule: [],
  };

  let extensionConfig = {};

  let readOnlyTransmissionStatus = {};

  function bytesToGigaBytes(bytes) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  }

  function updatepopUpInterface() {
    let readableMonthLeftElem = document.getElementById("month-data-left");
    readableMonthLeftElem.innerHTML =
      bytesToGigaBytes(mainInfo.bytesLeftThisMonth) + "&nbsp;GB";

    let readableDilyLeftProgressElem = document.getElementById(
      "daily-data-left-progress"
    );
    readableDilyLeftProgressElem.setAttribute(
      "max",
      parseInt(mainInfo.dailyDataCapInBytes)
    );
    readableDilyLeftProgressElem.setAttribute(
      "value",
      parseInt(mainInfo.bytesLeftToday)
    );

    let readableMonthLeftProgressElem = document.getElementById(
      "month-data-left-progress"
    );
    readableMonthLeftProgressElem.setAttribute(
      "max",
      mainInfo.monthlyDataCapInBytes
    );
    readableMonthLeftProgressElem.setAttribute(
      "value",
      mainInfo.bytesLeftThisMonth
    );

    let steadyTransferAdvise = document.getElementById(
      "steady-transfer-till-eom"
    );

    if ("eod" == extensionConfig.effectiveTransferType) {
      steadyTransferAdvise.innerHTML =
        parseInt(mainInfo.steadyTransferToEndOfDayInKbps) + " kB/s";
    } else {
      steadyTransferAdvise.innerHTML =
        parseInt(mainInfo.steadyTransferToEndOfMonthInKbps) + " kB/s";
    }

    let currentAltSpeedIndicator = document.getElementById("current-alt-speed");
    if (extensionConfig.restrictTorrentSpeed) {
      if (readOnlyTransmissionStatus.status == 200) {
        currentAltSpeedIndicator.innerHTML = readOnlyTransmissionStatus.altSpeed + " kB/s";
      } else {
        currentAltSpeedIndicator.innerHTML = "ERR";
      }
    } else {
      currentAltSpeedIndicator.innerHTML = "Off";
    }

    let normalMonthlyTransferElem = document.getElementById("normal-monthly-transfer");
    normalMonthlyTransferElem.innerHTML = parseInt(mainInfo.normalMonthlyTransfer) + " kB/s";

    let readableTodayLeftElem = document.getElementById("today-data-left");
    readableTodayLeftElem.innerHTML =
      bytesToGigaBytes(mainInfo.bytesLeftToday) + "&nbsp;GB";

    if (extensionConfig.showScheduleOnPopup) {
      let tableElem = document.getElementById("main-table");
      let newRow = tableElem.insertRow(-1);
      let newCell = newRow.insertCell(0);
      newCell.colSpan = "3";
      newText = document.createTextNode("Evenly scheduled use:");
      newCell.appendChild(newText);
      for (i = 0; i < mainInfo.healthySchedule.length; i++) {
        let newRow = tableElem.insertRow(-1);
        let newCell = newRow.insertCell(0);
        let dateObject = new Date(mainInfo.healthySchedule[i].date);
        let newText = dateObject.toDateString();
        newText = newText.substring(0, newText.length - 5);
        newText = document.createTextNode(newText);
        newCell.appendChild(newText);

        let newCell2 = newRow.insertCell(1);
        let newText2 = document.createTextNode(
          bytesToGigaBytes(mainInfo.healthySchedule[i].transferLeftOnEod) +
          "\u00A0GB"
        );
        newCell2.appendChild(newText2);

        let progressCell = newRow.insertCell(2);
        let progressElem = document.createElement("progress");
        progressElem.setAttribute("max", mainInfo.monthlyDataCapInBytes);
        progressElem.setAttribute(
          "value",
          mainInfo.healthySchedule[i].transferLeftOnEod
        );
        progressCell.appendChild(progressElem);
      }
    }
  }

  function loadConfigAndShow(configInLocalStorage) {
    extensionConfig = configInLocalStorage.config;
    if (!extensionConfig) {
      extensionConfig = {};
    }
    updatepopUpInterface();
  }

  function loadDataAndStatusAndConfigAndShow(dataSavedInLocalStorage) {
    mainInfo = dataSavedInLocalStorage.data;
    function loadTransmissionStatusAndConfigAndShow(transmissionStatus) {
      readOnlyTransmissionStatus = transmissionStatus.transmissionStatus;
      browser.storage.local.get("config").then(loadConfigAndShow);
    }
    browser.storage.local.get("transmissionStatus").then(loadTransmissionStatusAndConfigAndShow);
  }

  function openSettings() {
    browser.runtime.openOptionsPage();
  }

  let optionsBtn = document.getElementById("options-opener");
  optionsBtn.addEventListener("click", openSettings);

  browser.storage.local.get("data").then(loadDataAndStatusAndConfigAndShow);
})();
