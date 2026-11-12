# LockOut final talk: speaker notes

About 10 minutes: roughly 7 minutes of talking, a 2.5 minute live demo, and a slow last slide. Spoken pace is about 140 words a minute, and the script below is about 950 words.
Each slide ends on a line that leads into the next one, so nobody starts from nowhere. Bracketed text is a stage direction, not spoken.

## Who and when

| # | Slide | Speaker | Time |
|---|-------|---------|------|
| 01 | Title | Burcak, then Fritz says their name | 0:00 – 0:25 |
| 02 | 62 a day | Burcak | 0:25 – 1:00 |
| 03 | One free pole | Burcak | 1:00 – 1:30 |
| 04 | Dots vs colour | Burcak | 1:30 – 2:20 |
| 05 | 542 neighbourhoods | Fritz | 2:20 – 3:00 |
| 06 | Live demo | Fritz drives, Burcak narrates the rider | 3:00 – 5:30 |
| 07 | Not enough data | Fritz | 5:30 – 6:10 |
| 08 | €1,246 and locks | Burcak | 6:10 – 7:00 |
| 09 | Everyone parks differently | Burcak | 7:00 – 7:45 |
| 10 | What's next | Fritz | 7:45 – 8:40 |
| 11 | Thank you | Burcak and Fritz | 8:40 – 9:10 |
| 12 | Links | Both, then stay on it for questions | 9:10 – 10:00 |

Burcak sets up the problem and the human side (02–04, 08–09). Fritz owns the product and the demo (05–07, 10). Hand-offs are always on a question or a "so", never on a pause.

---

## 01 · Title (Burcak)

[Slide is up as people settle.]

Hi everyone, I'm Burcak, and this is Fritz. We're going to start with a question, and I'd like you to answer it honestly in your head. When did you last lock your bike somewhere and just hope? Hold onto that feeling, because it's exactly why we built LockOut.

## 02 · 62 a day (Burcak)

[Advance. The number counts in, bikes turn red one by one.]

Here is the number behind it. Sixty-two. That's how many bikes were reported stolen in Berlin, every single day, last year. One every twenty-three minutes. In the time I've been talking, someone's bike is already gone. And that's only the thefts people bothered to report.

## 03 · One free pole (Burcak)

[Advance. The street scene fades in under the lamp.]

Now think about how it actually feels. You arrive, you're a bit late, and there's one free pole. Under a streetlight, next to a closed shop. Is it safe here? You have no way to know. So you guess. Sometimes you guess right.

## 04 · Dots vs colour (Burcak)

[Advance. Dots appear on the left, then the calm blocks on the right.]

People have tried to help. Maps of theft exist. But a map with thousands of red dots is alarming and useless at the same time. Everything looks dangerous, so nothing tells you what to do. What you actually need is one clear answer for the place you're standing. And that is what Fritz is going to show you.

## 05 · 542 neighbourhoods (Fritz)

[Advance. Map fills in neighbourhood by neighbourhood.]

Thanks, Burcak. So we did exactly that. We took a year of police reports and gave every one of Berlin's five hundred and forty-two neighbourhoods a simple rating: low, medium or high risk. Blue, yellow, red. No dots, no statistics to read. You look at your spot, you see a colour. But a colour on its own isn't much use unless you can ask it a question, so let me show you.

## 06 · Live demo (Fritz drives, Burcak narrates)

[Advance, then open the app. Keep the slide for 5 seconds so the audience knows what to watch for, then switch.]

Fritz: Three steps. Find your street. Read the colour. Pick your lock.

[Demo script, about 2 minutes. Fritz types a street Burcak names from the audience or a prepared one, ideally somewhere with a high rating.]

Fritz: I'll type in a street. Burcak, where do you usually lock up?

Burcak: [names a street, say what you'd feel as a rider]. Honestly I'd never have guessed that one.

Fritz: There it is. A colour, and in plain words what that means for you. Now the part I like most: it also tells you what to do about it. Which brings me to something small but important in how we built this.

[Close the app tab, back to the deck.]

Backup if the network fails: say the three steps over the map on slide 05 and carry on. Do not debug live.

## 07 · Not enough data (Fritz)

[Advance. Low and High tiles appear, then the hatched one.]

You may have noticed some areas aren't a colour at all. They're hatched. That's on purpose. In a quiet street, two reports doesn't mean it's safe, it means we don't know yet. A lot of tools would paint that green and let you walk away happy. We'd rather say "not enough data" and let you decide. Being honest about what we don't know is part of the product. And the colour is only half the answer, so Burcak, what do you do once you know the risk?

## 08 · €1,246 and locks (Burcak)

[Advance. The number appears, then one lock, then the second drops in.]

You lock it properly. The average stolen bike is worth about twelve hundred and fifty euros. A good lock costs a fraction of that. So LockOut gives you one clear recommendation: a bike under a thousand euros gets one good lock. Anything worth more gets two, of different types, because thieves tend to specialise in one kind. Simple enough that you can follow it in ten seconds at the bike rack. But of course, not everyone parks the same way.

## 09 · Everyone parks differently (Burcak)

[Advance. The bars slide out across the day.]

When we started, we talked to people and built three riders from what they told us. Lena leaves her bike outside her flat all night. Murat leaves his at the station all day. Jonas stops for an hour here and there, evenings and weekends, on a bike he really loves. Same city, completely different risks. These three are composites, not real people, but they kept us honest every time we made a choice. And we don't want to stop at three. Fritz?

## 10 · What's next (Fritz)

[Advance. The little bike rides along the road.]

Right, and that's where you come in. We've tested with real riders this week [add one honest line about what you learned, or cut this sentence if you don't have it ready], and it's already changing what we build. Next up: sharing a spot with a friend, comparing two places, like home or the café, and a German version, because Berlin deserves it. Every one of those started as someone saying "but what about...". So keep saying it.

## 11 · Thank you (Burcak, then Fritz)

[Advance. The map sits behind the words.]

Burcak: That's LockOut. Sixty-two bikes a day, five hundred and forty-two neighbourhoods, and one simple answer before you lock.

Fritz: Thank you so much for listening.

## 12 · Links (both)

[Advance. Stay here for questions.]

Burcak: The app is live right now, so please try it on your next ride.

Fritz: And if you have a story about your own bike, or an idea, we'd really like to hear it. You'll find us on LinkedIn.

[Both stay on this slide for questions.]

---

## Before you present

- Add your LinkedIn handles in the `LINKEDIN` line near the bottom of `index.html`, or the slide shows placeholders.
- Slide 10 has one bracketed sentence about the rider test. Fill it with what you actually learned or delete it. I have no results for it.
- Run the demo once on the venue's wifi. Pick the street in advance and know its colour.
- Keys: arrows, Space or click to advance, `F` for fullscreen.
