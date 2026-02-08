const scheduleItems = [
  {
    event: "Biathlon · Women relay",
    time: "13:45 CET",
    location: "Antholz Arena",
  },
  {
    event: "Alpine · Men super-G",
    time: "14:10 CET",
    location: "Cortina d'Ampezzo",
  },
  {
    event: "Curling · SWE vs SUI",
    time: "15:00 CET",
    location: "Milano Ice Park",
  },
  {
    event: "Speed skating · 1500m",
    time: "17:25 CET",
    location: "Milano Rink",
  },
  {
    event: "Freestyle · Moguls final",
    time: "19:40 CET",
    location: "Livigno",
  },
];

const scheduleList = document.getElementById("schedule");

scheduleItems.forEach((item) => {
  const li = document.createElement("li");
  const details = document.createElement("div");
  const event = document.createElement("strong");
  const location = document.createElement("span");
  const time = document.createElement("strong");

  event.textContent = item.event;
  location.textContent = item.location;
  time.textContent = item.time;

  details.appendChild(event);
  details.appendChild(location);

  li.appendChild(details);
  li.appendChild(time);

  scheduleList.appendChild(li);
});

const refreshLabel = document.getElementById("last-refresh");

const updateRefreshTime = () => {
  const now = new Date();
  refreshLabel.textContent = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

updateRefreshTime();
setInterval(updateRefreshTime, 15000);
