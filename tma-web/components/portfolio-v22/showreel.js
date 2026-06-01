// Showreel content — the exact films V20 assigned to each flagship project.
const V = "/assets/videos";
const P = "/assets/videos/posters";
const yt = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const SHOWREEL = [
  {
    slug: "foodics-boundless",
    client: "Foodics",
    title: "Boundless",
    poster: "/assets/case-foodics-boundless.png",
    films: [
      { id: "f-bl-2022", title: "Boundless 2022", group: "Event Film", kind: "youtube", youtubeId: "ZqrF7NYuXHU", poster: yt("ZqrF7NYuXHU") },
      { id: "f-bl-2023", title: "Boundless 2023", group: "Event Film", kind: "youtube", youtubeId: "uzd9os9G1d8", poster: yt("uzd9os9G1d8") },
      { id: "f-cafe", title: "Café Spot", group: "TV Commercial", kind: "mp4", src: `${V}/media1.mp4`, poster: `${P}/media1.jpg` },
      { id: "f-living", title: "Living-Room Spot", group: "TV Commercial", kind: "mp4", src: `${V}/media5.mp4`, poster: `${P}/media5.jpg` },
      { id: "f-kiosk", title: "Self-Order Kiosk", group: "Product Film", kind: "mp4", src: `${V}/media6.mp4`, poster: `${P}/media6.jpg` },
      { id: "f-pos", title: "POS + Printer", group: "Product Film", kind: "mp4", src: `${V}/media22.mp4`, poster: `${P}/media22.jpg` },
      { id: "f-app", title: "App — New Version", group: "Product Film", kind: "mp4", src: `${V}/hero1.mp4`, poster: `${P}/hero1.jpg` },
    ],
  },
  {
    slug: "zid-ripple",
    client: "Zid",
    title: "Ripple",
    poster: "/assets/case-zid-ripple.png",
    films: [
      { id: "z-ripple-2024", title: "Ripple 2024", group: "Event Film", kind: "youtube", youtubeId: "GSSS71zV5HI", poster: yt("GSSS71zV5HI") },
      { id: "z-strategy", title: "Strategy Film", group: "Brand Film", kind: "mp4", src: `${V}/Zid%20-%20Strategy.MP4`, poster: `${P}/Zid---Strategy.jpg` },
    ],
  },
];
