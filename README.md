**Turf Rush** is a real-time, serverless multiplayer browser game inspired by the board game *Ready Set Bet*. Using a peer-to-peer (WebRTC) architecture, one screen acts as the authoritative race host while players join on mobile devices to place wagers as the race unfolds.

---

## Legal Disclaimer & Copyright Notice

* **Ready Set Bet:** This is an unofficial, non-commercial fan project inspired by the original board game *Ready Set Bet*, designed by John D. Clair and published by Alderac Entertainment Group (AEG). All original game mechanics, concepts, and board design references belong to their respective owners.
* **Uma Musume: Pretty Derby:** All characters, names, imagery, and related assets from *Uma Musume: Pretty Derby* are trademarks and copyrights of **Cygames, Inc.**
* **Non-Commercial Use:** This project is intended solely for entertainment purposes. No monetization, commercial exploitation, or copyright infringement is intended.

---

## ⚡ Key Features

* **Authoritative Host Engine (`host.html`):** Manages the 2D6 physics/probability engine on a 15-space track with 9 runner lanes (`2/3` to `11/12`), featuring consecutive roll streak bonuses (+1 to +3 spaces), adjustable speeds (1500 ms to 350 ms), dynamic race commentary, and automated payouts.
* **Real-Time Mobile Controller (`client.html`):** Mobile touch UI granting each player a fixed token pool per round (**$2, $3, $3, $4, and $5**) to place live wagers before runners cross the line.
* **First-Come, First-Served Concurrency:** Instant claim mechanic where the first wager processed by the host locks that slot in real time across all client screens.
* **Integrated Betting Markets:**
  * **Main Board:** Win, Place (top 2), and Show (top 3) wagers with explicit loss penalties.
  * **Color Side Bets:** Direct bets on runner colors (Blue 5x, Orange 3x, Red 2x) or on lane #7 finishing 5th or worse (4x).
  * **Prop Bets:** 5 random head-to-head match-up cards per round drawn from a 28-card deck (1 chip per card).
  * **Exotic Finish Deck:** Progressive condition cards (*Blow Out*, *Tight Race*, *Photo Finish*, *Longshot Glory*, and *Favorite's Fall*) evaluated post-race.
* **Track Milestones & Betting Lock:** Space 10 (Red Line) alerts sound for leading runners, triggering an instant, broadcasted betting lockdown (`BETS_CLOSED`) the moment a 3rd runner crosses, concluding at Space 15.
* **Podium Resolution & Standings:** Post-race results displaying animated gold/silver/bronze podium cards, exact final tile positions, track inspection toggle, and per-player payout/leaderboard modals.
* **Configurable Lobby & Rules:** Adjustable room capacity (2, 4, 6, or 8 players), custom starting cash, debt mode toggles, player kick controls, and easy join via 6-character room codes or QR codes.
* **Uma Musume DLC Integration:** Theme toggle between Classic Western and Anime styles, complete with a 100+ character pool (`uma_roster.json`), draft lineup modal with lane re-rolls, and synchronized avatar rendering across track, podium, and betting sheets.
* **Serverless P2P Architecture (WebRTC / PeerJS):** Direct browser-to-browser connection using public STUN servers—operates online (GitHub Pages) or over local Wi-Fi/LAN without dedicated backends.
* **Dynamic Bilingual Support (i18n):** Instant runtime switching between English and Spanish across the portal, host display, mobile controller, and commentary log.