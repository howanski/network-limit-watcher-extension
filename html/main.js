(function () {
  let mainInfo = {
    currentMonthMovementInBytes: 0,
    monthlyDataCapInBytes: 0,
    startOfMonthDay: 1,
    bytesLeftThisMonth: 0,
    bytesLeftToday: 0,
    dailyConsumableBytes: 0,
    milisecondsLeftThisMonth: 0,
    steadyTransferToEndOfMonthInKbps: 0,
    healthySchedule: [],
  };

  function bytesToGigaBytes(bytes) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  }

  function updatepopUpInterface() {
    let readableMonthLeftElem = document.getElementById("month-data-left");
    readableMonthLeftElem.innerHTML =
      bytesToGigaBytes(mainInfo.bytesLeftThisMonth) + " GB";

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
    steadyTransferAdvise.innerHTML =
      parseInt(mainInfo.steadyTransferToEndOfMonthInKbps) + " kB/s";

    let readableTodayLeftElem = document.getElementById("today-data-left");
    readableTodayLeftElem.innerHTML =
      bytesToGigaBytes(mainInfo.bytesLeftToday) + " GB";

    let tableElem = document.getElementById("main-table");
    for (i = 0; i < mainInfo.healthySchedule.length; i++) {
      // Print schedule for rest of the month
      let newRow = tableElem.insertRow(-1);

      let newCell = newRow.insertCell(0);
      let dateObject = new Date(mainInfo.healthySchedule[i].date);
      let newText = document.createTextNode(
        dateObject.getDate() + "." + (dateObject.getMonth() + 1)
      );
      newCell.appendChild(newText);

      let newCell2 = newRow.insertCell(1);
      let newText2 = document.createTextNode(
        bytesToGigaBytes(mainInfo.healthySchedule[i].transferLeftOnEod) + " GB"
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

  function loadDataAndShow(dataSavedInLocalStorage) {
    mainInfo = dataSavedInLocalStorage.data;
    updatepopUpInterface();
  }

  browser.storage.local.get("data").then(loadDataAndShow);
})();
