# LockOut final talk: speaker notes

---

## 01 · LockOut (Fritz)

[The slide is already up while people settle. The map fills in.]

Hi everyone. Before we tell you what LockOut is, think about the last time you locked your bike somewhere and just... hoped. Keep that feeling in mind, because that's where this starts. But first, who are we?

## 02 · The people behind it (Burcak, then Fritz)

[Advance. Both photos come in with the slide.]

**Burcak:** I'm Burcak. [One sentence on your background, the same line as on the slide.] On this project I looked after the data and the research.

**Fritz:** And I'm Fritz. [One sentence on your background, the same line as on the slide.] I built the product you'll see in a few minutes.

## 03 · You lock it. It's gone. (Burcak)

[Advance. The three lines appear on their own, then the lock drops from the post.]

Picture it. You lock your bike after work, at six. You come back later, and there's just an empty lamp post. That's not a made-up worst case, it's a reality and also the most common pattern in the police data: around four in ten bikes were last seen in the evening, between five and ten. If you ride in Berlin, this has probably happened to you, or to someone you know. And it happens a lot.

## 04 · Every 23 minutes (Burcak)

[Advance. The clock hand sweeps round.]

Every twenty-three minutes, a bike is stolen somewhere in Berlin. [click: the three figures appear] Just last year alone that was around twenty-three thousand bikes, that's around sixty every single day, and the average cost to each bike owner is over a thousand euros. And that's only for the thefts people reported. But here's the part that you might not be expecting.

## 05 · 9 in 10 were locked (Burcak)

[Advance. The grid of locks pops in.]

More than nine in ten stolen bikes were locked. The police record whether a lock had to be broken, and almost every time it did. So it's not about people being careless. The lock was there. So, if having a lock is not enough, what's there to do? We went looking for answers.

## 06 · The gap (Burcak, hands to Fritz)

[Advance. Left: Berlin in 12 districts, one highlighted. Right: the same city in 542 neighbourhoods, one pinned.]

Partly because of what's out there today. The theft numbers people can find are per district, and Berlin has twelve. Friedrichshain-Kreuzberg is one district, around 290,000 people, and it gets one number. That's far too big to tell you anything about the street you're standing on. And the lock tips you find online are the same for everyone, wherever you are. So we went much closer. Same city, 542 neighbourhoods. Wrangelkiez is just one of them. Small enough to be your street, and paired with what to do when you park there. Fritz, so what did we build?

## 07 · Police data in, one clear answer out (Fritz)

[Advance. The three steps come in along the line.]

Thanks, Burcak. The idea fits in one line: police data goes in, one clear answer comes out. It's three steps. First, you find your spot: type a street, or let the app find you. Second, you see how it compares to the whole of Berlin. And third, you lock it right, with advice from the police and cycling experts, not from us. Here's the whole city.

## 08 · Every neighbourhood, one colour (Fritz)

[Advance. The map colours in and the key appears.]

We took a year of police reports and gave every neighbourhood in Berlin one colour: low, medium or high. And these hatched ones are the places where there just aren't enough reports to say. I'll come back to those. First, Burcak, what does the colour actually tell you to do?

## 09 · A calm street is never a reason to lock less (Burcak)

[Advance. Only the headline shows.]

The most important rule first: a calm street is never a reason to lock less. The colour tells you where thefts are reported, but the advice has a floor that never drops. [click: left column] Always, for every bike on every street: one solid lock, and lock the frame and a wheel to something fixed. That's straight from the Berlin police. [click: right column] And the more your bike is worth to you, the more a second lock of a different type pays off, because, as the ADFC puts it, thieves usually specialise in one kind of lock. Something you can follow in ten seconds at the bike rack. But that's enough slides. Fritz?

## 10 · Let's try it (Fritz drives, Burcak plays the rider)

[Advance. Read the three steps, then switch to the app.]

**Fritz:** Let's try it, live. Three steps: find where I am, read the answer, pick the lock. Burcak, you're the rider. Where do you lock your bike?

**Burcak:** [Name the street you rehearsed.] Usually right outside the café there.

**Fritz:** [Type the street and select the area.] So here we are. A colour, and underneath it, what it means in plain words, compared to the rest of Berlin.

**Burcak:** [React honestly as a rider, for example:] I would not have guessed that. So what should I do?

**Fritz:** [Scroll to the lock advice.] That's the bit I like most. It doesn't just say "risky", it tells you what to bring. [Read out the recommendation.] [If there's time, tap "Use my location" to show it finding the area you're standing in.]

[Switch back to the deck.]

Backup if the network or the app fails: stay on this slide, point at the phone picture and say the three steps out loud with Wrangelkiez as the example: high risk, so use two locks. Then move on. Don't try to fix it live.

## 11 · When we don't know, we say so (Fritz)

[Advance. Only the headline shows.]

Remember the hatched areas? This is one of the choices we're proudest of. [click] Where there's plenty of data, you get a rating you can lean on. [click] Where there's some, it's our best read, and it could shift. [click] But where there are only a couple of reports, we don't give a rating at all, and we never call it "safe". Two thefts in a quiet street doesn't mean it's safe; it means we don't know yet. And that honesty runs through the whole app: no accounts, no tracking, and the code is open for anyone to check. So where do we take it from here? Burcak?

## 12 · Berlin is only the first city (Burcak)

[Advance. The dotted line keeps moving to the right.]

Today, LockOut is live for every neighbourhood in Berlin, on any phone. Next, we want to test it on real streets with real cyclists, because so far it has only been tried by us. And after that, any city where the police share their theft data could have the same thing. Berlin is only the first city.

## 13 · Danke (both)

[Advance. Stay on this slide through the questions so people can scan the code.]

**Burcak:** So if there's one thing to take home: try it tonight, before you lock up. Just scan the code.

**Fritz:** And if you've got your own bike story, or an idea for us, find us on LinkedIn. We'd really love to hear it. Danke, thank you for listening.

---

## Before you present

- **Team photos (slide 02):** save a portrait photo of each of you as `docs/final-presentation/team/burcak.jpg` and `docs/final-presentation/team/fritz.jpg` (about 3:4, at least 720 × 900 px). They appear automatically. Until then the slide shows your initials and the file name to use.
- **Backgrounds (slide 02):** replace the two yellow `[… background, one line]` placeholders in `index.html` with one short line each, for example what you studied or worked on before. The yellow highlight comes from the `todo` class; remove `class="todo"` from each line once it's filled in.
- **LinkedIn links:** paste your profile URLs into the `LINKEDIN` line near the bottom of `index.html`. Until then, the names on slide 13 show as plain text.
- **QR code:** it's drawn by a small script loaded from cdnjs. If the venue blocks it, the box shows the app's address in large type instead, so open the deck once on the venue's wifi to check.
- **Demo:** rehearse it once on the venue's network. Choose the street in advance and know its colour and lock advice. Have the app open in a second tab before you start.
- **No personas:** slide 03 uses a generic "you" scene and a real police figure (evening is the most common last-seen time, 38%, rounded to "around 4 in 10"). Nothing in the deck or script presents invented people or interviews as real.
- **Keys:** → / Space / click to go forward (or reveal the next item on slides 04, 09 and 11), ← or a click on the left third of the screen to step back, `F` for full screen, Home / End to jump. You can also open a single slide by adding its number to the address, for example `index.html#10`.
