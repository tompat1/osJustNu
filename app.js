const fallbackScheduleItems = [
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

const fallbackNewsItems = [
  {
    tag: "Breaking",
    title: "Skicross squad announces final lineup after training run",
    detail: "Coaches confirm Holmgren replaces Lind in heat 3. Updated 12 min ago.",
  },
  {
    tag: "Interview",
    title: "\"We feel the ice\" - Swedish curling team confident ahead of semifinal",
    detail: "Skip Ekström says the sweep is \"the best it's been\" this season.",
  },
  {
    tag: "Analysis",
    title: "Nordic combined medal math: what Sweden needs tonight",
    detail: "Explainer on points needed for a podium finish in the team format.",
  },
];

const fallbackResults = [
  {
    title: "Ice Hockey · SWE vs CAN",
    detail: "Period 2 · 08:21 left",
    score: "2 - 1",
  },
  {
    title: "Cross-country · Women 10km",
    detail: "Split 7 · Frida Karlsson",
    score: "+3.2s",
  },
  {
    title: "Snowboard · Slopestyle",
    detail: "Final run · Jennie Söder",
    score: "84.40",
  },
];

const scheduleList = document.getElementById("schedule");
const newsList = document.getElementById("news-list");
const resultsList = document.getElementById("results");
const refreshLabel = document.getElementById("last-refresh");
const feedStatusList = document.getElementById("feed-status");
const liveCount = document.getElementById("live-count");
const liveDetail = document.getElementById("live-detail");
const upcomingCount = document.getElementById("upcoming-count");
const upcomingDetail = document.getElementById("upcoming-detail");

const feedConfig = [
  {
    id: "scoreboard",
    label: "NHL scoreboard",
    url: "https://r.jina.ai/http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
    type: "scoreboard",
  },
  {
    id: "nhl-news",
    label: "NHL news",
    url: "https://r.jina.ai/http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news",
    type: "news",
  },
  {
    id: "top-news",
    label: "ESPN headlines",
    url: "https://r.jina.ai/http://site.api.espn.com/apis/site/v2/sports/news",
    type: "news",
  },
  {
    id: "rss",
    label: "ESPN RSS (scraped)",
    url: "https://r.jina.ai/http://www.espn.com/espn/rss/news",
    type: "rss",
  },
];

const fetchWithTimeout = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  return response.text();
};

const updateRefreshTime = () => {
  const now = new Date();
  refreshLabel.textContent = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const clearList = (list) => {
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
};

const renderSchedule = (items) => {
  clearList(scheduleList);
  items.forEach((item) => {
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
};

const renderNews = (items) => {
  clearList(newsList);
  items.forEach((item) => {
    const li = document.createElement("li");
    const tag = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("h4");
    const detail = document.createElement("p");

    tag.className = "tag";
    tag.textContent = item.tag;
    title.textContent = item.title;
    detail.textContent = item.detail;

    content.appendChild(title);
    content.appendChild(detail);
    li.appendChild(tag);
    li.appendChild(content);

    newsList.appendChild(li);
  });
};

const renderResults = (items) => {
  clearList(resultsList);
  items.forEach((item) => {
    const wrapper = document.createElement("div");
    const content = document.createElement("div");
    const title = document.createElement("h4");
    const detail = document.createElement("p");
    const score = document.createElement("strong");

    wrapper.className = "result";
    title.textContent = item.title;
    detail.textContent = item.detail;
    score.textContent = item.score;

    content.appendChild(title);
    content.appendChild(detail);
    wrapper.appendChild(content);
    wrapper.appendChild(score);

    resultsList.appendChild(wrapper);
  });
};

const renderFeedStatus = (statuses) => {
  clearList(feedStatusList);
  statuses.forEach((status) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    const state = document.createElement("span");

    label.textContent = status.label;
    state.textContent = status.state;
    state.style.color = status.color;

    li.appendChild(label);
    li.appendChild(state);
    feedStatusList.appendChild(li);
  });
};

const parseScoreboard = (payload) => {
  const events = payload.events ?? [];
  const liveEvents = events.filter((event) => event.status?.type?.state === "in");
  const upcomingEvents = events.filter((event) => event.status?.type?.state === "pre");
  const displayedEvents = [...liveEvents, ...upcomingEvents].slice(0, 3);

  const results = displayedEvents.map((event) => {
    const competition = event.competitions?.[0] ?? {};
    const competitors = competition.competitors ?? [];
    const away = competitors.find((team) => team.homeAway === "away") ?? competitors[0];
    const home = competitors.find((team) => team.homeAway === "home") ?? competitors[1];
    const awayName = away?.team?.shortDisplayName ?? away?.team?.displayName ?? "Away";
    const homeName = home?.team?.shortDisplayName ?? home?.team?.displayName ?? "Home";
    const title = `${event.shortName ?? `${awayName} vs ${homeName}`}`;
    const detail =
      competition.status?.type?.shortDetail ??
      event.status?.type?.shortDetail ??
      "Scheduled";
    const awayScore = away?.score ?? "--";
    const homeScore = home?.score ?? "--";

    return {
      title,
      detail,
      score: `${awayScore} - ${homeScore}`,
    };
  });

  const nextEvent = upcomingEvents[0];
  const nextTime = nextEvent ? new Date(nextEvent.date) : null;
  const nextTimeLabel = nextTime
    ? nextTime.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    : "TBD";

  return {
    liveCount: liveEvents.length,
    upcomingCount: upcomingEvents.length,
    nextTimeLabel,
    results: results.length ? results : fallbackResults,
    upcomingSchedule: upcomingEvents.slice(0, 5).map((event) => ({
      event: event.shortName ?? event.name ?? "Upcoming ESPN event",
      time: new Date(event.date).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      location: event.competitions?.[0]?.venue?.fullName ?? "ESPN feed",
    })),
  };
};

const parseNews = (payload) => {
  const articles = payload.articles ?? [];
  return articles.slice(0, 3).map((article) => ({
    tag: article.type ?? "ESPN",
    title: article.headline ?? "ESPN update",
    detail: article.description ?? article.published ?? "Latest ESPN report",
  }));
};

const parseRss = (text) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0, 2);
  return items.map((item) => ({
    tag: "RSS",
    title: item.querySelector("title")?.textContent ?? "ESPN headline",
    detail: item.querySelector("pubDate")?.textContent ?? "Scraped feed update",
  }));
};

const updateDashboard = async () => {
  const statuses = [];
  let scoreboardData = null;
  const newsPayloads = [];
  let rssData = null;

  for (const feed of feedConfig) {
    try {
      const responseText = await fetchWithTimeout(feed.url);
      statuses.push({
        label: feed.label,
        state: "Live",
        color: "#59f2c1",
      });

      if (feed.type === "scoreboard") {
        scoreboardData = JSON.parse(responseText);
      }

      if (feed.type === "news") {
        newsPayloads.push(JSON.parse(responseText));
      }

      if (feed.type === "rss") {
        rssData = responseText;
      }
    } catch (error) {
      statuses.push({
        label: feed.label,
        state: "Fallback",
        color: "#f2b459",
      });
    }
  }

  if (!scoreboardData) {
    liveCount.textContent = "--";
    liveDetail.textContent = "Using cached results";
    upcomingCount.textContent = "--";
    upcomingDetail.textContent = "Using cached schedule";
    renderResults(fallbackResults);
    renderSchedule(fallbackScheduleItems);
  } else {
    const parsed = parseScoreboard(scoreboardData);
    liveCount.textContent = parsed.liveCount.toString();
    liveDetail.textContent = `Across ESPN winter coverage`;
    upcomingCount.textContent = parsed.upcomingCount.toString();
    upcomingDetail.textContent = `Next: ${parsed.nextTimeLabel} CET`;
    renderResults(parsed.results);
    renderSchedule(parsed.upcomingSchedule.length ? parsed.upcomingSchedule : fallbackScheduleItems);
  }

  const newsItems = newsPayloads.flatMap((payload) => parseNews(payload));
  const rssItems = rssData ? parseRss(rssData) : [];
  const combinedNews = [...newsItems, ...rssItems];
  renderNews(combinedNews.length ? combinedNews : fallbackNewsItems);

  renderFeedStatus(statuses);
  updateRefreshTime();
};

renderSchedule(fallbackScheduleItems);
renderNews(fallbackNewsItems);
renderResults(fallbackResults);
updateRefreshTime();
updateDashboard();
setInterval(updateDashboard, 30000);
